import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import { getCachedData, invalidateCachePattern, CacheKeys } from '@/lib/cache/cache-service'

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
      customerId,
      deletedAt: null // Excluir soft deleted por defecto
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
    const category = await prisma.category.create({
      data: {
        customerId,
        name: data.name,
        description: data.description,
        isActive: true
      }
    })

    // Invalidar caché de categorías de este cliente
    invalidateCachePattern(`category:${customerId}*`)

    return category
  }

  // Actualizar categoría
  static async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<Category> {
    // Obtener categoría para saber el customerId
    const category = await this.getCategoryById(id)
    
    const updated = await prisma.category.update({
      where: { id },
      data
    })

    // Invalidar caché de categorías si existe
    if (category) {
      invalidateCachePattern(`category:${category.customerId}*`)
    }

    return updated
  }

  // Eliminar categoría (soft delete)
  static async deleteCategory(id: string): Promise<void> {
    // Obtener categoría para saber el customerId antes de eliminar
    const category = await this.getCategoryById(id)
    
    // Soft delete en lugar de eliminación física
    await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    // Invalidar caché de categorías si existe
    if (category) {
      invalidateCachePattern(`category:${category.customerId}*`)
    }
  }

  // Restaurar categoría (deshacer soft delete)
  static async restoreCategory(id: string): Promise<Category> {
    const category = await this.getCategoryById(id)
    
    const restored = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    // Invalidar caché
    if (category) {
      invalidateCachePattern(`category:${category.customerId}*`)
    }

    return restored
  }

  // Obtener categorías activas (para selects) - CON CACHÉ
  static async getActiveCategories(customerId: string) {
    const cacheKey = CacheKeys.category(customerId, 'active')
    
    return getCachedData(
      cacheKey,
      () => prisma.category.findMany({
        where: {
          customerId,
          isActive: true,
          deletedAt: null // Excluir soft deleted
        },
        orderBy: { name: 'asc' }
      }),
      600 // Cache por 10 minutos (categorías no cambian frecuentemente)
    )
  }
}

