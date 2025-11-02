import { prisma } from '@/lib/prisma'
import { SalesCustomer } from '@prisma/client'

export interface CreateSalesCustomerData {
  name: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  ruc?: string
}

export interface UpdateSalesCustomerData {
  name?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  ruc?: string
  isActive?: boolean
}

export class SalesCustomerService {
  // Obtener todos los clientes de una organización
  static async getAllCustomers(
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
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { ruc: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [customers, total] = await Promise.all([
      prisma.salesCustomer.findMany({
        where,
        skip,
        take,
        orderBy: [
          { lastName: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.salesCustomer.count({ where })
    ])

    return { customers, total }
  }

  // Obtener cliente por ID
  static async getCustomerById(id: string): Promise<SalesCustomer | null> {
    return prisma.salesCustomer.findUnique({
      where: { id }
    })
  }

  // Crear nuevo cliente
  static async createCustomer(
    organizationId: string,
    data: CreateSalesCustomerData
  ): Promise<SalesCustomer> {
    return prisma.salesCustomer.create({
      data: {
        organizationId,
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ruc: data.ruc,
        isActive: true
      }
    })
  }

  // Actualizar cliente
  static async updateCustomer(
    id: string,
    data: UpdateSalesCustomerData
  ): Promise<SalesCustomer> {
    return prisma.salesCustomer.update({
      where: { id },
      data
    })
  }

  // Eliminar cliente (soft delete)
  static async deleteCustomer(id: string): Promise<void> {
    await prisma.salesCustomer.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
  }

  // Restaurar cliente (deshacer soft delete)
  static async restoreCustomer(id: string): Promise<SalesCustomer> {
    return prisma.salesCustomer.update({
      where: { id },
      data: {
        deletedAt: null
      }
    })
  }

  // Obtener cliente por organización (sin paginación - para selects)
  static async getCustomersByOrganization(organizationId: string) {
    return prisma.salesCustomer.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null // Excluir soft deleted
      },
      orderBy: [
        { lastName: 'asc' },
        { name: 'asc' }
      ]
    })
  }
}

