import { prisma } from '../prisma'
import type { Customer, Organization } from '@prisma/client'

export class CustomerService {
  // Obtener todos los clientes de una organización
  static async getCustomersByOrganization(organizationId: string) {
    return await prisma.customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener todos los clientes de un usuario
  static async getCustomersByUser(userId: string) {
    return await prisma.customer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener un cliente por ID
  static async getCustomerById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        organization: true,
        orders: {
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  // Crear un nuevo cliente
  static async createCustomer(data: {
    userId: string
    organizationId?: string
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
    city?: string
    country?: string
  }) {
    return await prisma.customer.create({
      data
    })
  }

  // Actualizar un cliente
  static async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  // Eliminar un cliente
  static async deleteCustomer(id: string) {
    return await prisma.customer.delete({
      where: { id }
    })
  }

  // Buscar clientes por nombre o email
  static async searchCustomers(query: string, organizationId?: string) {
    const where = organizationId 
      ? { 
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } }
          ]
        }

    return await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener estadísticas de clientes
  static async getCustomerStats(organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    const [total, recent] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      })
    ])

    return { total, recent }
  }
}
