import { prisma } from '@/lib/prisma'
import { Branch } from '@prisma/client'

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
    status?: string
  ) {
    const where: any = {
      organizationId
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
              name: true
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
        organization: true
      }
    })
  }

  // Crear nueva sucursal
  static async createBranch(
    organizationId: string,
    data: CreateBranchData
  ): Promise<Branch> {
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
            name: true
          }
        }
      }
    })
  }

  // Actualizar sucursal
  static async updateBranch(
    id: string,
    data: UpdateBranchData
  ): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // Eliminar sucursal
  static async deleteBranch(id: string): Promise<void> {
    await prisma.branch.delete({
      where: { id }
    })
  }

  // Obtener sucursales activas para selects
  static async getActiveBranches(organizationId: string) {
    return prisma.branch.findMany({
      where: {
        organizationId,
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })
  }
}

