import { prisma } from '@/lib/prisma'
import { SalesProduct } from '@prisma/client'
import { getCachedData, invalidateCachePattern, CacheKeys } from '@/lib/cache/cache-service'
import { logDatabase } from '@/lib/utils/logger'
import { CommonIncludes } from '@/lib/utils/query-optimizer'
import { NotificationService } from '@/lib/services/notification-service'

export interface CreateSalesProductData {
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
  // Obtener todos los productos de un cliente
  static async getAllProducts(
    customerId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    categoryId?: string,
    includeDeleted: boolean = false
  ) {
    const where: any = {
      customerId,
      ...(includeDeleted ? {} : { deletedAt: null }) // Excluir soft deleted por defecto
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
        include: CommonIncludes.product, // Usar include optimizado
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesProduct.count({ where })
    ])
    
    const duration = Date.now() - startTime
    logDatabase('FIND_MANY', 'sales_products', duration, undefined, {
      customerId,
      count: products.length,
    })

    return { products, total }
  }

  // Obtener producto por ID
  static async getProductById(id: string, includeDeleted: boolean = false): Promise<SalesProduct | null> {
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      include: {
        category: true
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
    customerId: string,
    data: CreateSalesProductData
  ): Promise<SalesProduct> {
    const startTime = Date.now()
    const product = await prisma.salesProduct.create({
      data: {
        customerId,
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

    // Invalidar caché de productos de este cliente
    invalidateCachePattern(`product:${customerId}*`)

    return product
  }

  // Actualizar producto
  static async updateProduct(
    id: string,
    data: UpdateSalesProductData
  ): Promise<SalesProduct> {
    // Obtener customerId antes de actualizar
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      select: { customerId: true }
    })
    
    const updated = await prisma.salesProduct.update({
      where: { id },
      data: {
        ...data,
        brand: data.brand !== undefined ? data.brand : undefined,
        model: data.model !== undefined ? data.model : undefined,
      },
      include: {
        customer: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    // Invalidar caché de productos si existe
    if (product) {
      invalidateCachePattern(`product:${product.customerId}*`)
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
          updated.customerId || undefined
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
  static async deleteProduct(id: string): Promise<void> {
    // Obtener producto para saber el customerId ANTES de eliminar
    const product = await prisma.salesProduct.findUnique({
      where: { id },
      select: { customerId: true }
    })
    
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
      customerId: product?.customerId,
    })

    // Invalidar caché de productos si existe
    if (product) {
      invalidateCachePattern(`product:${product.customerId}*`)
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
    if (restored.customerId) {
      invalidateCachePattern(`product:${restored.customerId}*`)
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
    invalidateCachePattern(`product:${product.customerId}*`)

    return updated
  }

  // Obtener productos activos (para selects) - CON CACHÉ
  static async getActiveProducts(customerId: string) {
    const cacheKey = CacheKeys.product(customerId, 'active')
    
    return getCachedData(
      cacheKey,
      () => prisma.salesProduct.findMany({
        where: {
          customerId,
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

