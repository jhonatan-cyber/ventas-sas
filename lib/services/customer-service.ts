import { prisma } from '../prisma'

import type { Customer as AppCustomer } from '@/lib/types'
import type { Customer, OrganizationSubscriptionStatus } from '@prisma/client'

type OrganizationSummary = {
  id: string
  name: string
  slug: string
  razonSocial: string | null
  nit: string | null
  subscriptionStatus: OrganizationSubscriptionStatus
}

function withPrimaryOrganization(customer: Customer, organization?: OrganizationSummary | null): AppCustomer {
  return {
    ...customer,
    primaryOrganization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          razonSocial: organization.razonSocial,
          nit: organization.nit,
          subscriptionStatus: organization.subscriptionStatus,
        }
      : null,
    razonSocial: organization?.razonSocial ?? null,
    nit: organization?.nit ?? null,
    slug: organization?.slug ?? null,
    organizationId: organization?.id ?? null,
  }
}

export class CustomerService {
  private static async fetchOrganizationSummary(organizationId: string): Promise<OrganizationSummary | null> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        razonSocial: true,
        nit: true,
        subscriptionStatus: true,
      },
    })

    return organization ?? null
  }

  // Obtener todos los clientes de una organización
  static async getCustomersByOrganization(organizationId: string) {
    const relations = await prisma.customerOrganization.findMany({
      where: { organizationId, isActive: true },
      include: {
        customer: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            razonSocial: true,
            nit: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return relations
      .map((relation) => {
        if (!relation.customer) return null
        return withPrimaryOrganization(relation.customer, relation.organization)
      })
      .filter(Boolean) as AppCustomer[]
  }

  // Obtener todos los clientes de un usuario
  static async getCustomersByUser(userId: string) {
    const customers = await prisma.customer.findMany({
      where: { userId },
      include: {
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                razonSocial: true,
                nit: true,
                subscriptionStatus: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return customers.map((customer) =>
      withPrimaryOrganization(
        customer,
        customer.organizations?.[0]?.organization ?? null
      )
    )
  }

  // Obtener un cliente por ID
  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                razonSocial: true,
                nit: true,
                subscriptionStatus: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!customer) return null

    return withPrimaryOrganization(
      customer,
      customer.organizations?.[0]?.organization ?? null
    )
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
    const { organizationId, ...customerData } = data

    const customer = await prisma.customer.create({
      data: {
        userId: customerData.userId,
        nombre: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country,
      },
    })

    if (!organizationId) {
      return withPrimaryOrganization(customer, null)
    }

    await prisma.customerOrganization.create({
      data: {
        customerId: customer.id,
        organizationId,
        isActive: true,
      },
    })

    const organization = await CustomerService.fetchOrganizationSummary(organizationId)

    return withPrimaryOrganization(customer, organization)
  }

  // Actualizar un cliente
  static async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    const relation = await prisma.customerOrganization.findFirst({
      where: { customerId: id, isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            razonSocial: true,
            nit: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return withPrimaryOrganization(updated, relation?.organization)
  }

  // Eliminar un cliente
  static async deleteCustomer(id: string) {
    await prisma.customerOrganization.deleteMany({
      where: { customerId: id },
    })

    return prisma.customer.delete({
      where: { id },
    })
  }

  // Buscar clientes por nombre o email
  static async searchCustomers(query: string, organizationId?: string) {
    if (organizationId) {
      const relations = await prisma.customerOrganization.findMany({
        where: {
          organizationId,
          isActive: true,
          customer: {
            OR: [
              { nombre: { contains: query, mode: 'insensitive' } },
              { apellido: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        include: {
          customer: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              razonSocial: true,
              nit: true,
              subscriptionStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return relations
        .map((relation) => {
          if (!relation.customer) return null
          return withPrimaryOrganization(relation.customer, relation.organization)
        })
        .filter(Boolean) as AppCustomer[]
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                razonSocial: true,
                nit: true,
                subscriptionStatus: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return customers.map((customer) =>
      withPrimaryOrganization(
        customer,
        customer.organizations?.[0]?.organization ?? null
      )
    )
  }

  // Obtener estadísticas de clientes
  static async getCustomerStats(organizationId?: string) {
    if (organizationId) {
      const [total, recent] = await Promise.all([
        prisma.customerOrganization.count({
          where: { organizationId, isActive: true },
        }),
        prisma.customerOrganization.count({
          where: {
            organizationId,
            isActive: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ])

      return { total, recent }
    }

    const [total, recent] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return { total, recent }
  }
}
