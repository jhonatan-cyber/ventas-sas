import { prisma } from '@/lib/prisma'
import { SalesCustomer } from '@prisma/client'

export interface CreateSalesCustomerData {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  ruc?: string
}

export interface UpdateSalesCustomerData {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
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
    status?: string
  ) {
    const where: any = {
      organizationId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
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
        orderBy: { createdAt: 'desc' }
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
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
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

  // Eliminar cliente
  static async deleteCustomer(id: string): Promise<void> {
    await prisma.salesCustomer.delete({
      where: { id }
    })
  }

  // Obtener cliente por organización (sin paginación - para selects)
  static async getCustomersByOrganization(organizationId: string) {
    return prisma.salesCustomer.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })
  }
}

