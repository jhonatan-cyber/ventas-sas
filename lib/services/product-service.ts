import { prisma } from '../prisma'
import type { Product, Organization } from '@prisma/client'

export class ProductService {
  // Obtener todos los productos de una organización
  static async getProductsByOrganization(organizationId: string) {
    return await prisma.product.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener todos los productos de un usuario
  static async getProductsByUser(userId: string) {
    return await prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener un producto por ID
  static async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        organization: true,
        orderItems: {
          include: {
            order: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })
  }

  // Crear un nuevo producto
  static async createProduct(data: {
    userId: string
    organizationId?: string
    name: string
    description?: string
    price: number
    stock: number
    sku?: string
    category?: string
    imageUrl?: string
  }) {
    return await prisma.product.create({
      data
    })
  }

  // Actualizar un producto
  static async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  // Eliminar un producto
  static async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id }
    })
  }

  // Buscar productos por nombre, SKU o categoría
  static async searchProducts(query: string, organizationId?: string) {
    const where = organizationId 
      ? { 
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }

    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener productos por categoría
  static async getProductsByCategory(category: string, organizationId?: string) {
    const where = organizationId 
      ? { organizationId, category }
      : { category }

    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener productos con stock bajo
  static async getLowStockProducts(threshold: number = 10, organizationId?: string) {
    const where = organizationId 
      ? { organizationId, stock: { lte: threshold } }
      : { stock: { lte: threshold } }

    return await prisma.product.findMany({
      where,
      orderBy: { stock: 'asc' }
    })
  }

  // Actualizar stock de un producto
  static async updateStock(id: string, newStock: number) {
    return await prisma.product.update({
      where: { id },
      data: { 
        stock: newStock,
        updatedAt: new Date()
      }
    })
  }

  // Obtener estadísticas de productos
  static async getProductStats(organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    const [total, lowStock, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.count({
        where: {
          ...where,
          stock: { lte: 10 }
        }
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: {
          ...where,
          category: { not: null }
        },
        _count: { category: true }
      })
    ])

    return { total, lowStock, categories: categories.length }
  }

  // Obtener productos más vendidos
  static async getTopSellingProducts(limit: number = 10, organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    return await prisma.product.findMany({
      where,
      include: {
        orderItems: {
          select: {
            quantity: true
          }
        }
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: limit
    })
  }
}
