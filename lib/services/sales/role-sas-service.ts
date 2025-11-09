import { prisma } from '@/lib/prisma'
import { RoleSas } from '@prisma/client'
import { logDatabase } from '@/lib/utils/logger'

export interface CreateRoleSasData {
  nombre: string
  descripcion?: string
  sucursalId?: string
}

export interface UpdateRoleSasData {
  nombre?: string
  descripcion?: string
  sucursalId?: string
  isActive?: boolean
}

export class RoleSasService {
  // Obtener todos los roles de una organización
  static async getAllRoles(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    sucursalId?: string,
    includeDeleted: boolean = false
  ) {
    const where: any = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }) // Excluir soft deleted por defecto
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    const [roles, total] = await Promise.all([
      prisma.roleSas.findMany({
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
          sucursal: {
            select: {
              name: true
            }
          },
          _count: { select: { usuariosSas: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.roleSas.count({ where })
    ])

    return { roles, total }
  }

  // Obtener rol por ID
  static async getRoleById(id: string, includeDeleted: boolean = false): Promise<RoleSas | null> {
    const role = await prisma.roleSas.findUnique({
      where: { id },
      include: {
        organization: true,
        sucursal: true
      }
    })
    
    // Si no se incluyen eliminados y el rol está eliminado, retornar null
    if (!includeDeleted && role && role.deletedAt) {
      return null
    }
    
    return role
  }

  // Crear nuevo rol
  static async createRole(
    organizationId: string,
    data: CreateRoleSasData
  ) {
    return prisma.roleSas.create({
      data: {
        organizationId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        sucursalId: data.sucursalId,
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
        sucursal: {
          select: {
            name: true
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

  // Actualizar rol
  static async updateRole(
    id: string,
    data: UpdateRoleSasData
  ) {
    return prisma.roleSas.update({
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
        sucursal: {
          select: {
            name: true
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

  // Eliminar rol (soft delete)
  static async deleteRole(id: string): Promise<void> {
    const startTime = Date.now()
    await prisma.roleSas.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('SOFT_DELETE', 'roles_sas', duration, undefined, {
      roleId: id,
    })
  }
  
  // Restaurar rol (deshacer soft delete)
  static async restoreRole(id: string): Promise<RoleSas> {
    const startTime = Date.now()
    const restored = await prisma.roleSas.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        organization: true,
        sucursal: true
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('RESTORE', 'roles_sas', duration, undefined, {
      roleId: id,
    })
    
    return restored
  }

  // Obtener roles activos por organización (para selects)
  static async getActiveRolesByOrganization(organizationId: string, sucursalId?: string) {
    const where: any = {
      organizationId,
      isActive: true
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    return prisma.roleSas.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })
  }
}

