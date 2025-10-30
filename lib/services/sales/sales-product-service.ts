import { prisma } from '@/lib/prisma'
import { SalesProduct } from '@prisma/client'

export interface CreateSalesProductData {
  categoryId?: string
  name: string
  description?: string
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
  // Obtener todos los productos de una organización
  static async getAllProducts(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    categoryId?: string
  ) {
    const where: any = {
      organizationId
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

    const [products, total] = await Promise.all([
      prisma.salesProduct.findMany({
        where,
        skip,
        take,
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesProduct.count({ where })
    ])

    return { products, total }
  }

  // Obtener producto por ID
  static async getProductById(id: string): Promise<SalesProduct | null> {
    return prisma.salesProduct.findUnique({
      where: { id },
      include: {
        category: true
      }
    })
  }

  // Crear nuevo producto
  static async createProduct(
    organizationId: string,
    data: CreateSalesProductData
  ): Promise<SalesProduct> {
    return prisma.salesProduct.create({
      data: {
        organizationId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
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
  }

  // Actualizar producto
  static async updateProduct(
    id: string,
    data: UpdateSalesProductData
  ): Promise<SalesProduct> {
    return prisma.salesProduct.update({
      where: { id },
      data
    })
  }

  // Eliminar producto
  static async deleteProduct(id: string): Promise<void> {
    await prisma.salesProduct.delete({
      where: { id }
    })
  }

  // Actualizar stock
  static async updateStock(id: string, quantity: number): Promise<SalesProduct> {
    const product = await prisma.salesProduct.findUnique({
      where: { id }
    })

    if (!product) {
      throw new Error('Producto no encontrado')
    }

    return prisma.salesProduct.update({
      where: { id },
      data: {
        stock: product.stock + quantity
      }
    })
  }

  // Obtener productos activos (para selects)
  static async getActiveProducts(organizationId: string) {
    return prisma.salesProduct.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    })
  }
}

