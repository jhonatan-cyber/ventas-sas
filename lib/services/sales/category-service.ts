import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

export interface CreateCategoryData {
  name: string
  description?: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  isActive?: boolean
}

export class CategoryService {
  // Obtener todas las categorías de un cliente
  static async getAllCategories(
    customerId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string
  ) {
    const where: any = {
      customerId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.count({ where })
    ])

    return { categories, total }
  }

  // Obtener categoría por ID
  static async getCategoryById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
  }

  // Crear nueva categoría
  static async createCategory(
    customerId: string,
    data: CreateCategoryData
  ): Promise<Category> {
    return prisma.category.create({
      data: {
        customerId,
        name: data.name,
        description: data.description,
        isActive: true
      }
    })
  }

  // Actualizar categoría
  static async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data
    })
  }

  // Eliminar categoría
  static async deleteCategory(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id }
    })
  }

  // Obtener categorías activas (para selects)
  static async getActiveCategories(customerId: string) {
    return prisma.category.findMany({
      where: {
        customerId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })
  }
}

