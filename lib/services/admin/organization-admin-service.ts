import { prisma } from '@/lib/prisma'
import { Organization, SubscriptionPlan } from '@prisma/client'

export interface OrganizationWithPlan extends Organization {
  subscriptionPlan?: SubscriptionPlan | null
  _count: {
    profiles: number
    customers: number
    products: number
    orders: number
  }
}

export interface CreateOrganizationData {
  name: string
  slug: string
  ownerId: string
  subscriptionPlanId?: string
  subscriptionStatus?: string
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  settings?: any
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  subscriptionPlanId?: string
  subscriptionStatus?: string
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  settings?: any
}

export class OrganizationAdminService {
  // Obtener todas las organizaciones con estadísticas
  static async getAllOrganizations(): Promise<OrganizationWithPlan[]> {
    return prisma.organization.findMany({
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            profiles: true,
            customers: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener organización por ID
  static async getOrganizationById(id: string): Promise<OrganizationWithPlan | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            profiles: true,
            customers: true,
            products: true,
            orders: true
          }
        }
      }
    })
  }

  // Crear nueva organización
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    return prisma.organization.create({
      data: {
        ...data,
        subscriptionStatus: data.subscriptionStatus || 'trial',
        subscriptionStartDate: data.subscriptionStartDate || new Date(),
        subscriptionEndDate: data.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    })
  }

  // Actualizar organización
  static async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data
    })
  }

  // Eliminar organización
  static async deleteOrganization(id: string): Promise<Organization> {
    // Primero eliminar todos los datos relacionados
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          organizationId: id
        }
      }
    })

    await prisma.order.deleteMany({
      where: { organizationId: id }
    })

    await prisma.product.deleteMany({
      where: { organizationId: id }
    })

    await prisma.customer.deleteMany({
      where: { organizationId: id }
    })

    await prisma.organizationMember.deleteMany({
      where: { organizationId: id }
    })

    await prisma.profile.deleteMany({
      where: { organizationId: id }
    })

    return prisma.organization.delete({
      where: { id }
    })
  }

  // Suspender organización
  static async suspendOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: 'suspended' }
    })
  }

  // Reactivar organización
  static async reactivateOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: 'active' }
    })
  }

  // Cambiar plan de suscripción
  static async changeSubscriptionPlan(id: string, planId: string): Promise<Organization> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      throw new Error('Plan de suscripción no encontrado')
    }

    return prisma.organization.update({
      where: { id },
      data: {
        subscriptionPlanId: planId,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    })
  }

  // Obtener estadísticas de organizaciones
  static async getOrganizationStats() {
    const total = await prisma.organization.count()
    const active = await prisma.organization.count({
      where: { subscriptionStatus: 'active' }
    })
    const suspended = await prisma.organization.count({
      where: { subscriptionStatus: 'suspended' }
    })
    const trial = await prisma.organization.count({
      where: { subscriptionStatus: 'trial' }
    })

    return { total, active, suspended, trial }
  }

  // Buscar organizaciones
  static async searchOrganizations(query: string): Promise<OrganizationWithPlan[]> {
    return prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            profiles: true,
            customers: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
