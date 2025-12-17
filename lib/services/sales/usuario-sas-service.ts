import { UsuarioSas } from '@prisma/client'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { logDatabase } from '@/lib/utils/logger'

export interface CreateUsuarioSasData {
  ci?: string
  nombre: string
  apellido: string
  address?: string
  phone?: string
  email?: string
  password?: string
  rolId?: string
  foto?: string
  sucursalId?: string
}

export interface UpdateUsuarioSasData {
  ci?: string
  nombre?: string
  apellido?: string
  address?: string
  phone?: string
  email?: string
  password?: string
  rolId?: string
  foto?: string
  sucursalId?: string
  isActive?: boolean
}

export class UsuarioSasService {
  // Obtener todos los usuarios de una organización
  static async getAllUsuarios(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    rolId?: string,
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
        { apellido: { contains: search, mode: 'insensitive' } },
        { ci: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (rolId) {
      where.rolId = rolId
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuarioSas.findMany({
        where,
        skip,
        take,
        include: {
          rol: {
            select: {
              id: true,
              nombre: true
            }
          },
          sucursal: {
            select: {
              id: true,
              name: true
            }
          },
          organization: {
            select: {
              id: true,
              razonSocial: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.usuarioSas.count({ where })
    ])

    return { usuarios, total }
  }

  // Obtener usuario por ID
  static async getUsuarioById(id: string, includeDeleted: boolean = false): Promise<UsuarioSas | null> {
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id },
      include: {
        rol: true,
        sucursal: true,
        organization: true
      }
    })
    
    // Si no se incluyen eliminados y el usuario está eliminado, retornar null
    if (!includeDeleted && usuario && usuario.deletedAt) {
      return null
    }
    
    return usuario
  }

  // Crear nuevo usuario
  static async createUsuario(
    organizationId: string,
    data: CreateUsuarioSasData
  ) {
    // Hashear contraseña si se proporciona
    let hashedPassword = null
    if (data.password) {
      hashedPassword = await PasswordService.hashPassword(data.password)
    } else if (data.ci) {
      // Si no hay contraseña pero hay CI, usar CI como contraseña por defecto
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    return prisma.usuarioSas.create({
      data: {
        organizationId,
        ci: data.ci,
        nombre: data.nombre,
        apellido: data.apellido,
        address: data.address,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        rolId: data.rolId,
        foto: data.foto,
        sucursalId: data.sucursalId,
        isActive: true
      },
      include: {
        rol: {
          select: {
            id: true,
            nombre: true
          }
        },
        sucursal: {
          select: {
            id: true,
            name: true
          }
        },
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
  }

  // Actualizar usuario
  static async updateUsuario(
    id: string,
    data: UpdateUsuarioSasData
  ): Promise<UsuarioSas> {
    const updateData: any = { ...data }

    // Hashear nueva contraseña si se proporciona
    if (data.password) {
      updateData.password = await PasswordService.hashPassword(data.password)
      
      // Invalidar sesiones al cambiar contraseña
      const { SessionManagement } = await import("@/lib/auth/session-management")
      const usuario = await prisma.usuarioSas.findUnique({
        where: { id },
        select: { organizationId: true }
      })
      
      if (usuario?.organizationId) {
        await SessionManagement.invalidateSessionsOnPasswordChange(id, 'sas', usuario.organizationId)
      }
      
      // Marcar fecha de cambio de contraseña
      updateData.passwordChangedAt = new Date()
    } else {
      // No actualizar contraseña si no se proporciona
      delete updateData.password
    }

    return prisma.usuarioSas.update({
      where: { id },
      data: updateData,
      include: {
        rol: {
          select: {
            id: true,
            nombre: true
          }
        },
        sucursal: {
          select: {
            id: true,
            name: true
          }
        },
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
  }

  // Eliminar usuario (soft delete)
  static async deleteUsuario(id: string): Promise<void> {
    const startTime = Date.now()
    await prisma.usuarioSas.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('SOFT_DELETE', 'usuarios_sas', duration, undefined, {
      usuarioId: id,
    })
  }

  // Restaurar usuario (deshacer soft delete)
  static async restoreUsuario(id: string): Promise<UsuarioSas> {
    const startTime = Date.now()
    const restored = await prisma.usuarioSas.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        rol: true,
        sucursal: true,
        organization: true
      }
    })
    
    const duration = Date.now() - startTime
    logDatabase('RESTORE', 'usuarios_sas', duration, undefined, {
      usuarioId: id,
    })
    
    return restored
  }

  // Obtener usuarios activos por organización (para selects)
  static async getActiveUsuariosByOrganization(organizationId: string, sucursalId?: string) {
    const where: any = {
      organizationId,
      isActive: true
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    return prisma.usuarioSas.findMany({
      where,
      include: {
        rol: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })
  }
}

