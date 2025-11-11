import { Category } from '@prisma/client'

import { getCachedData, invalidateCachePattern, CacheKeys } from '@/lib/cache/cache-service'
import { prisma } from '@/lib/prisma'

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
  // Obtener todas las categorías de una organización
  static async getAllCategories(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string
  ) {
    const where: any = {
      organizationId,
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
    organizationId: string,
    data: CreateCategoryData
  ): Promise<Category & { _count?: { products: number } }> {
    const category = await prisma.category.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        isActive: true
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    // Invalidar caché de categorías de esta organización
    invalidateCachePattern(`category:${organizationId}*`)

    return category
  }

  // Actualizar categoría
  static async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<Category & { _count?: { products: number } }> {
    // Obtener categoría para saber el organizationId
    const category = await this.getCategoryById(id)
    
    const updated = await prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    // Invalidar caché de categorías si existe
    if (category) {
      invalidateCachePattern(`category:${category.organizationId}*`)
    }

    return updated
  }

  // Eliminar categoría (soft delete)
  static async deleteCategory(id: string): Promise<void> {
    // Obtener categoría para saber el organizationId antes de eliminar
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
      invalidateCachePattern(`category:${category.organizationId}*`)
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
      invalidateCachePattern(`category:${category.organizationId}*`)
    }

    return restored
  }

  // Obtener categorías activas (para selects) - CON CACHÉ
  // Siempre retorna todas las categorías activas de la organización
  // El filtrado por sucursal se aplica solo a los productos, no a las categorías
  static async getActiveCategories(organizationId: string, _branchId?: string) {
    const cacheKey = CacheKeys.category(organizationId, 'active')
    
    return getCachedData(
      cacheKey,
      () => prisma.category.findMany({
        where: {
          organizationId,
          isActive: true,
          deletedAt: null // Excluir soft deleted
        },
        orderBy: { name: 'asc' }
      }),
      600 // Cache por 10 minutos (categorías no cambian frecuentemente)
    )
  }
}

