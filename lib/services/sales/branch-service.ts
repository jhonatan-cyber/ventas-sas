import { prisma } from '@/lib/prisma'
import { Branch } from '@prisma/client'
import { logDatabase } from '@/lib/utils/logger'

export interface CreateBranchData {
  name: string
  address?: string
  phone?: string
  email?: string
}

export interface UpdateBranchData {
  name?: string
  address?: string
  phone?: string
  email?: string
  isActive?: boolean
}

export class BranchService {
  // Obtener todas las sucursales de una organización
  static async getAllBranches(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    includeDeleted: boolean = false
  ) {
    const where: any = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }) // Excluir soft deleted por defecto
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take,
        include: {
          organization: {
            select: {
              id: true,
              razonSocial: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              usuariosSas: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.branch.count({ where })
    ])

    return { branches, total }
  }

  // Obtener sucursal por ID
  static async getBranchById(id: string): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            razonSocial: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            usuariosSas: true
          }
        }
      }
    })
  }

  // Crear nueva sucursal
  static async createBranch(
    organizationId: string,
    data: CreateBranchData
  ) {
    return prisma.branch.create({
      data: {
        organizationId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: true
      },
      include: {
        organization: {
          select: {
            id: true,
            razonSocial: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            usuariosSas: true
          }
        }
      }
    })
  }

  // Actualizar sucursal
  static async updateBranch(
    id: string,
    data: UpdateBranchData
  ) {
    return prisma.branch.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            id: true,
            razonSocial: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            usuariosSas: true
          }
        }
      }
    })
  }

  // Eliminar sucursal (soft delete)
  static async deleteBranch(id: string): Promise<void> {
    const startTime = Date.now()
    await prisma.branch.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('SOFT_DELETE', 'branches', duration, undefined, {
      branchId: id,
    })
  }
  
  // Restaurar sucursal (deshacer soft delete)
  static async restoreBranch(id: string): Promise<Branch> {
    const startTime = Date.now()
    const restored = await prisma.branch.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        organization: {
          select: {
            id: true,
            razonSocial: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('RESTORE', 'branches', duration, undefined, {
      branchId: id,
    })
    
    return restored
  }

  // Obtener sucursales activas para selects
  static async getActiveBranches(organizationId: string) {
    return prisma.branch.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null // Excluir soft deleted
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })
  }
}

