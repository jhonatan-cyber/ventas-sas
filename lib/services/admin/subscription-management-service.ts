import { prisma } from '@/lib/prisma'

export interface CreateSubscriptionData {
  organizationId?: string
  customerId?: string
  planId: string
  billingPeriod: "monthly" | "yearly"
  startDate?: Date
  endDate?: Date
  autoRenew?: boolean
}

export interface UpdateSubscriptionData {
  planId?: string
  status?: "active" | "cancelled" | "expired" | "trial"
  billingPeriod?: "monthly" | "yearly"
  startDate?: Date
  endDate?: Date
  autoRenew?: boolean
}

export class SubscriptionManagementService {
  // Obtener todas las suscripciones
  static async getAllSubscriptions(skip: number = 0, take: number = 10, search?: string, status?: string) {
    const where: any = {}

    if (search) {
      where.OR = [
        { organization: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { razonSocial: { contains: search, mode: 'insensitive' } } },
        { customer: { nombre: { contains: search, mode: 'insensitive' } } },
        { customer: { apellido: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { nit: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
        { organization: { slug: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          customer: {
            select: {
              id: true,
              razonSocial: true,
              nit: true,
              nombre: true,
              apellido: true,
              email: true,
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              priceMonthly: true,
              priceYearly: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subscription.count({ where })
    ])

    return { subscriptions, total }
  }

  // Obtener suscripción por ID
  static async getSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        organization: true,
        customer: true,
        plan: true
      }
    })
  }

  // Crear nueva suscripción
  static async createSubscription(data: CreateSubscriptionData) {
    // Calcular la fecha de finalización basada en el período de facturación
    let endDate = data.endDate
    if (!endDate) {
      const start = data.startDate || new Date()
      const end = new Date(start)
      if (data.billingPeriod === "yearly") {
        end.setFullYear(end.getFullYear() + 1)
      } else {
        end.setMonth(end.getMonth() + 1)
      }
      endDate = end
    }

    return prisma.subscription.create({
      data: {
        organizationId: data.organizationId,
        customerId: data.customerId,
        planId: data.planId,
        status: "active",
        billingPeriod: data.billingPeriod,
        startDate: data.startDate || new Date(),
        endDate,
        autoRenew: data.autoRenew ?? true
      },
      include: {
        organization: true,
        customer: true,
        plan: true
      }
    })
  }

  // Actualizar suscripción
  static async updateSubscription(id: string, data: UpdateSubscriptionData) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: {
        organization: true,
        customer: true,
        plan: true
      }
    })
  }

  // Eliminar suscripción
  static async deleteSubscription(id: string) {
    return prisma.subscription.delete({
      where: { id }
    })
  }

  // Obtener todas las organizaciones
  static async getAllOrganizations() {
    return prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' }
    })
  }

  // Obtener todos los planes
  static async getAllPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
      },
      orderBy: { name: 'asc' }
    })
  }
}

