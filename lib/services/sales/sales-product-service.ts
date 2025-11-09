import { prisma } from '@/lib/prisma'
import { SalesProduct, Prisma } from '@prisma/client'
import { getCachedData, invalidateCachePattern, CacheKeys } from '@/lib/cache/cache-service'
import { logDatabase } from '@/lib/utils/logger'
import { CommonIncludes } from '@/lib/utils/query-optimizer'
import { NotificationService } from '@/lib/services/notification-service'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface CreateSalesProductData {
  branchId?: string
  categoryId?: string
  name: string
  description?: string
  brand?: string
  model?: string
  price: number
  cost: number
  stock?: number
  minStock?: number
  sku?: string
  barcode?: string
  imageUrl?: string
}

export interface UpdateSalesProductData {
  branchId?: string
  categoryId?: string
  name?: string
  description?: string
  brand?: string
  model?: string
  price?: number
  cost?: number
  stock?: number
  minStock?: number
  sku?: string
  barcode?: string
  imageUrl?: string
  isActive?: boolean
}

export class SalesProductService {
  // Obtener todos los productos de una organización (opcionalmente filtrados por sucursal)
  static async getAllProducts(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    categoryId?: string,
    branchId?: string,
    includeDeleted: boolean = false
  ) {
    const where: any = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }) // Excluir soft deleted por defecto
    }

    // Filtrar por sucursal si se proporciona
    if (branchId) {
      where.branchId = branchId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const startTime = Date.now()
    const [products, total] = await Promise.all([
      prisma.salesProduct.findMany({
        where,
        skip,
        take,
        include: {
          ...CommonIncludes.product,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesProduct.count({ where })
    ])
    
    const duration = Date.now() - startTime
    logDatabase('FIND_MANY', 'sales_products', duration, undefined, {
      organizationId,
      count: products.length,
    })

    return { products, total }
  }

  // Obtener producto por ID
  static async getProductById(id: string, includeDeleted: boolean = false): Promise<(SalesProduct & {
    category: { id: string; name: string } | null;
    branch: { id: string; name: string } | null;
  }) | null> {
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      include: {
        category: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    })

    // Si no se incluyen eliminados y el producto está eliminado, retornar null
    if (!includeDeleted && product && 'deletedAt' in product && product.deletedAt) {
      return null
    }

    return product
  }

  // Crear nuevo producto
  static async createProduct(
    organizationId: string,
    data: CreateSalesProductData
  ): Promise<SalesProduct> {
    const startTime = Date.now()
    const product = await prisma.salesProduct.create({
      data: {
        organizationId,
        branchId: data.branchId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model,
        price: data.price,
        cost: data.cost,
        stock: data.stock || 0,
        minStock: data.minStock || 0,
        sku: data.sku,
        barcode: data.barcode,
        imageUrl: data.imageUrl,
        isActive: true
      }
    })

    // Invalidar caché de productos de esta organización
    invalidateCachePattern(`product:${organizationId}*`)

    return product
  }

  // Actualizar producto
  static async updateProduct(
    id: string,
    data: UpdateSalesProductData
  ): Promise<SalesProduct> {
    // Obtener organizationId antes de actualizar
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      select: { organizationId: true }
    })
    
    const updated = await prisma.salesProduct.update({
      where: { id },
      data: {
        ...data,
        brand: data.brand !== undefined ? data.brand : undefined,
        model: data.model !== undefined ? data.model : undefined,
      },
      include: {
        organization: {
          select: {
            id: true,
          },
        },
      },
    })

    // Invalidar caché de productos si existe
    if (product) {
      invalidateCachePattern(`product:${product.organizationId}*`)
    }

    // Notificar si el stock está bajo
    if (data.stock !== undefined && updated.minStock !== null) {
      const finalStock = data.stock
      const minStock = updated.minStock || 0
      
      if (finalStock <= minStock && updated.organizationId) {
        NotificationService.notifyStockLow(
          updated.organizationId,
          updated.id,
          updated.name,
          finalStock,
          minStock,
          updated.organizationId || undefined
        ).catch((error) => {
          logDatabase('NOTIFICATION_ERROR', 'notifications', undefined, error as Error, {
            productId: updated.id,
          })
        })
      }
    }

    return updated
  }

  // Eliminar producto (soft delete)
  static async deleteProduct(id: string, slug?: string): Promise<void> {
    // Obtener producto para saber el organizationId y imageUrl ANTES de eliminar
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      select: { 
        organizationId: true,
        imageUrl: true
      }
    })
    
    // Eliminar imagen asociada si existe y es una ruta local
    if (product?.imageUrl && slug) {
      try {
        // Verificar si es una ruta local (no URL externa)
        if (product.imageUrl.startsWith('/uploads/products/')) {
          // Extraer el nombre del archivo de la ruta
          const imagePath = join(process.cwd(), 'public', product.imageUrl)
          
          // Verificar que el archivo existe antes de intentar eliminarlo
          if (existsSync(imagePath)) {
            await unlink(imagePath)
            logDatabase('FILE_DELETE', 'product_image', 0, undefined, {
              productId: id,
              imagePath: product.imageUrl,
            })
          }
        }
      } catch (error) {
        // Log el error pero no fallar la eliminación del producto
        logDatabase('FILE_DELETE_ERROR', 'product_image', 0, error as Error, {
          productId: id,
          imagePath: product.imageUrl,
        })
      }
    }
    
    // Soft delete en lugar de eliminación física
    const startTime = Date.now()
    await prisma.salesProduct.update({
      where: { id },
      data: {
        deletedAt: new Date()
      } as any // deletedAt está en el schema pero TypeScript puede no reconocerlo inmediatamente
    })
    
    const duration = Date.now() - startTime
    logDatabase('SOFT_DELETE', 'sales_products', duration, undefined, {
      productId: id,
      organizationId: product?.organizationId,
    })

    // Invalidar caché de productos si existe
    if (product) {
      invalidateCachePattern(`product:${product.organizationId}*`)
    }
  }

  // Restaurar producto (deshacer soft delete)
  static async restoreProduct(id: string): Promise<SalesProduct> {
    const restored = await prisma.salesProduct.update({
      where: { id },
      data: {
        deletedAt: null
      } as any, // deletedAt está en el schema pero TypeScript puede no reconocerlo inmediatamente
      include: {
        category: true
      }
    })

    // Invalidar caché
    if (restored.organizationId) {
      invalidateCachePattern(`product:${restored.organizationId}*`)
    }

    return restored
  }

  // Actualizar stock
  static async updateStock(id: string, quantity: number): Promise<SalesProduct> {
    const product = await prisma.salesProduct.findUnique({
      where: { id }
    })

    if (!product) {
      throw new Error('Producto no encontrado')
    }

    const updated = await prisma.salesProduct.update({
      where: { id },
      data: {
        stock: product.stock + quantity
      }
    })

    // Invalidar caché de productos (el stock cambió)
    invalidateCachePattern(`product:${product.organizationId}*`)

    return updated
  }

  // Obtener productos activos (para selects) - CON CACHÉ
  // Opcionalmente filtrados por sucursal
  static async getActiveProducts(organizationId: string, branchId?: string) {
    const cacheKey = CacheKeys.product(organizationId, branchId ? `active-${branchId}` : 'active')
    
    return getCachedData(
      cacheKey,
      () => prisma.salesProduct.findMany({
        where: {
          organizationId,
          ...(branchId ? { branchId } : {}),
          isActive: true,
          deletedAt: null // Excluir soft deleted
        } as any, // deletedAt está en el schema pero TypeScript puede no reconocerlo inmediatamente
        include: {
          category: true
        },
        orderBy: { name: 'asc' }
      }),
      300 // Cache por 5 minutos (productos pueden cambiar más frecuentemente)
    )
  }
}

