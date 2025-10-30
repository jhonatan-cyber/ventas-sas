import { prisma } from '@/lib/prisma'
import { SubscriptionPlan, Organization } from '@prisma/client'

export interface SubscriptionPlanWithStats extends SubscriptionPlan {
  _count: {
    organizations: number
  }
}

export interface CreateSubscriptionPlanData {
  name: string
  description?: string
  hasMonthly?: boolean
  hasYearly?: boolean
  priceMonthly?: number
  priceYearly?: number
  features?: string[]
  modules?: string[]
  maxUsers?: number
  maxProducts?: number
  maxOrders?: number
  isActive?: boolean
}

export interface UpdateSubscriptionPlanData {
  name?: string
  description?: string
  hasMonthly?: boolean
  hasYearly?: boolean
  priceMonthly?: number
  priceYearly?: number
  features?: string[]
  modules?: string[]
  maxUsers?: number
  maxProducts?: number
  maxOrders?: number
  isActive?: boolean
}

export class SubscriptionAdminService {
  // Obtener todos los planes con estadísticas
  static async getAllPlans(): Promise<SubscriptionPlanWithStats[]> {
    return prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener plan por ID
  static async getPlanById(id: string): Promise<SubscriptionPlanWithStats | null> {
    return prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      }
    })
  }

  // Crear nuevo plan
  static async createPlan(data: CreateSubscriptionPlanData): Promise<SubscriptionPlan> {
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        hasMonthly: data.hasMonthly || false,
        hasYearly: data.hasYearly || false,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        features: data.features || [],
        modules: data.modules,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        maxOrders: data.maxOrders,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
  }

  // Actualizar plan
  static async updatePlan(id: string, data: UpdateSubscriptionPlanData): Promise<SubscriptionPlan> {
    return prisma.subscriptionPlan.update({
      where: { id },
      data
    })
  }

  // Eliminar plan
  static async deletePlan(id: string): Promise<SubscriptionPlan> {
    // Verificar si el plan está siendo usado
    const usageCount = await prisma.organization.count({
      where: { subscriptionPlanId: id }
    })

    if (usageCount > 0) {
      throw new Error('No se puede eliminar el plan porque está siendo usado por organizaciones')
    }

    return prisma.subscriptionPlan.delete({
      where: { id }
    })
  }

  // Activar/Desactivar plan
  static async togglePlanStatus(id: string, isActive: boolean): Promise<SubscriptionPlan> {
    if (!id) {
      throw new Error('Plan ID is required')
    }
    return prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive }
    })
  }

  // Obtener organizaciones con un plan específico
  static async getOrganizationsWithPlan(planId: string): Promise<Organization[]> {
    return prisma.organization.findMany({
      where: { subscriptionPlanId: planId },
      include: {
        subscriptionPlan: true
      }
    })
  }

  // Obtener estadísticas de planes
  static async getPlanStats() {
    const total = await prisma.subscriptionPlan.count()
    const active = await prisma.subscriptionPlan.count({
      where: { isActive: true }
    })
    const inactive = await prisma.subscriptionPlan.count({
      where: { isActive: false }
    })

    // Estadísticas de uso
    const plansWithUsage = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      }
    })

    const totalOrganizations = plansWithUsage.reduce((sum, plan) => sum + plan._count.organizations, 0)

    return { total, active, inactive, totalOrganizations }
  }

  // Buscar planes
  static async searchPlans(query: string): Promise<SubscriptionPlanWithStats[]> {
    return prisma.subscriptionPlan.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Duplicar plan
  static async duplicatePlan(id: string, newName: string): Promise<SubscriptionPlan> {
    const originalPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    })

    if (!originalPlan) {
      throw new Error('Plan no encontrado')
    }

    return prisma.subscriptionPlan.create({
      data: {
        name: newName,
        description: `${originalPlan.description} (Copia)`,
        price: originalPlan.price,
        billingPeriod: originalPlan.billingPeriod,
        features: originalPlan.features as string[],
        maxUsers: originalPlan.maxUsers,
        maxProducts: originalPlan.maxProducts,
        maxOrders: originalPlan.maxOrders,
        isActive: false // Los planes duplicados empiezan inactivos
      }
    })
  }

  // Obtener planes más populares
  static async getPopularPlans(limit: number = 5): Promise<SubscriptionPlanWithStats[]> {
    return prisma.subscriptionPlan.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      },
      orderBy: {
        organizations: {
          _count: 'desc'
        }
      }
    })
  }

  // Obtener ingresos por plan
  static async getRevenueByPlan() {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        organizations: true
      }
    })

    return plans.map(plan => ({
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      organizations: plan.organizations.length,
      totalRevenue: plan.price.toNumber() * plan.organizations.length
    }))
  }

  // Validar límites de plan
  static async validatePlanLimits(organizationId: string, planId: string): Promise<{
    isValid: boolean
    violations: string[]
  }> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return { isValid: false, violations: ['Plan no encontrado'] }
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            profiles: true,
            products: true,
            orders: true
          }
        }
      }
    })

    if (!organization) {
      return { isValid: false, violations: ['Organización no encontrada'] }
    }

    const violations: string[] = []

    if (plan.maxUsers && organization._count.profiles > plan.maxUsers) {
      violations.push(`Límite de usuarios excedido: ${organization._count.profiles}/${plan.maxUsers}`)
    }

    if (plan.maxProducts && organization._count.products > plan.maxProducts) {
      violations.push(`Límite de productos excedido: ${organization._count.products}/${plan.maxProducts}`)
    }

    if (plan.maxOrders && organization._count.orders > plan.maxOrders) {
      violations.push(`Límite de órdenes excedido: ${organization._count.orders}/${plan.maxOrders}`)
    }

    return {
      isValid: violations.length === 0,
      violations
    }
  }
}
