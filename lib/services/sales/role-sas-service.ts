import { prisma } from '@/lib/prisma'
import { RoleSas } from '@prisma/client'

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
  // Obtener todos los roles de un cliente
  static async getAllRoles(
    customerId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    sucursalId?: string
  ) {
    const where: any = {
      customerId
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
          customer: {
            select: {
              razonSocial: true,
              nombre: true,
              apellido: true
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
  static async getRoleById(id: string): Promise<RoleSas | null> {
    return prisma.roleSas.findUnique({
      where: { id },
      include: {
        customer: true,
        sucursal: true
      }
    })
  }

  // Crear nuevo rol
  static async createRole(
    customerId: string,
    data: CreateRoleSasData
  ): Promise<RoleSas> {
    return prisma.roleSas.create({
      data: {
        customerId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        sucursalId: data.sucursalId,
        isActive: true
      }
    })
  }

  // Actualizar rol
  static async updateRole(
    id: string,
    data: UpdateRoleSasData
  ): Promise<RoleSas> {
    return prisma.roleSas.update({
      where: { id },
      data
    })
  }

  // Eliminar rol
  static async deleteRole(id: string): Promise<void> {
    await prisma.roleSas.delete({
      where: { id }
    })
  }

  // Obtener roles activos por cliente (para selects)
  static async getActiveRolesByCustomer(customerId: string, sucursalId?: string) {
    const where: any = {
      customerId,
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

