import { SubscriptionPlan, Organization, SubscriptionStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

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
  maxBranches?: number
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
  maxBranches?: number
  isActive?: boolean
}

export class SubscriptionAdminService {
  // Obtener todos los planes con estadísticas
  static async getAllPlans(): Promise<SubscriptionPlanWithStats[]> {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Para cada plan, contar también las organizaciones con suscripciones activas
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        // Obtener IDs únicos de organizaciones con suscripciones activas en la tabla Subscription
        const activeSubscriptionOrgs = await prisma.subscription.findMany({
          where: {
            planId: plan.id,
            status: {
              in: [SubscriptionStatus.active, SubscriptionStatus.trial]
            },
            OR: [
              { endDate: null },
              { endDate: { gt: new Date() } }
            ]
          },
          select: {
            organizationId: true
          },
          distinct: ['organizationId']
        })

        const activeSubscriptionOrgIds = activeSubscriptionOrgs.map(s => s.organizationId)

        // Contar organizaciones con subscriptionPlanId directo que NO están ya contadas en las suscripciones
        const directOrgCount = await prisma.organization.count({
          where: {
            subscriptionPlanId: plan.id,
            id: {
              notIn: activeSubscriptionOrgIds
            }
          }
        })

        // Total = organizaciones con suscripciones activas + organizaciones con plan directo (sin duplicar)
        const totalOrganizations = activeSubscriptionOrgs.length + directOrgCount

        return {
          ...plan,
          _count: {
            organizations: totalOrganizations
          }
        }
      })
    )

    return plansWithCounts
  }

  // Obtener plan por ID
  static async getPlanById(id: string): Promise<SubscriptionPlanWithStats | null> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true
          }
        }
      }
    })

    if (!plan) {
      return null
    }

    // Obtener IDs únicos de organizaciones con suscripciones activas en la tabla Subscription
    const activeSubscriptionOrgs = await prisma.subscription.findMany({
      where: {
        planId: plan.id,
        status: {
          in: [SubscriptionStatus.active, SubscriptionStatus.trial]
        },
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
      },
      select: {
        organizationId: true
      },
      distinct: ['organizationId']
    })

    const activeSubscriptionOrgIds = activeSubscriptionOrgs.map(s => s.organizationId)

    // Contar organizaciones con subscriptionPlanId directo que NO están ya contadas en las suscripciones
    const directOrgCount = await prisma.organization.count({
      where: {
        subscriptionPlanId: plan.id,
        id: {
          notIn: activeSubscriptionOrgIds
        }
      }
    })

    // Total = organizaciones con suscripciones activas + organizaciones con plan directo (sin duplicar)
    const totalOrganizations = activeSubscriptionOrgs.length + directOrgCount

    return {
      ...plan,
      _count: {
        organizations: totalOrganizations
      }
    }
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
        maxBranches: data.maxBranches,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
  }

  // Actualizar plan
  // IMPORTANTE: Los cambios en el plan se aplican automáticamente a todas las organizaciones
  // que tienen este plan asignado (Organization.subscriptionPlanId) porque la relación
  // es por referencia. No se requiere actualización manual de cada organización.
  static async updatePlan(id: string, data: UpdateSubscriptionPlanData): Promise<SubscriptionPlan> {
    // Contar organizaciones afectadas antes de actualizar
    const _affectedOrgsCount = await prisma.organization.count({
      where: { subscriptionPlanId: id }
    })

    // Contar suscripciones activas afectadas
    const _affectedSubscriptionsCount = await prisma.subscription.count({
      where: {
        planId: id,
        status: {
          in: [SubscriptionStatus.active, SubscriptionStatus.trial]
        }
      }
    })

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data
    })

    return updatedPlan
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
        priceMonthly: originalPlan.priceMonthly,
        priceYearly: originalPlan.priceYearly,
        hasMonthly: originalPlan.hasMonthly,
        hasYearly: originalPlan.hasYearly,
        features: originalPlan.features as string[],
        modules: originalPlan.modules as any,
        maxUsers: originalPlan.maxUsers,
        maxProducts: originalPlan.maxProducts,
        maxBranches: originalPlan.maxBranches,
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
        organizations: {
          include: {
            subscriptions: {
              where: {
                status: 'active'
              },
              take: 1,
              orderBy: {
                startDate: 'desc'
              }
            }
          }
        }
      }
    })

    return plans.map(plan => {
      // Usar priceMonthly como base (o priceYearly / 12 si solo tiene yearly)
      const basePrice = plan.priceMonthly 
        ? plan.priceMonthly.toNumber() 
        : (plan.priceYearly ? plan.priceYearly.toNumber() / 12 : 0)
      
      const activeOrganizations = plan.organizations.filter(org => {
        // Organización activa si tiene suscripción activa
        return org.subscriptions && org.subscriptions.length > 0
      }).length

      return {
        planId: plan.id,
        planName: plan.name,
        priceMonthly: plan.priceMonthly?.toNumber() || 0,
        priceYearly: plan.priceYearly?.toNumber() || 0,
        organizations: plan.organizations.length,
        activeOrganizations,
        totalRevenue: basePrice * activeOrganizations
      }
    })
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
            organizationMembers: true,
            products: true,
            branches: true
          }
        }
      }
    })

    if (!organization) {
      return { isValid: false, violations: ['Organización no encontrada'] }
    }

    const violations: string[] = []

    if (plan.maxUsers && organization._count.organizationMembers > plan.maxUsers) {
      violations.push(`Límite de usuarios excedido: ${organization._count.organizationMembers}/${plan.maxUsers}`)
    }

    if (plan.maxProducts && organization._count.products > plan.maxProducts) {
      violations.push(`Límite de productos excedido: ${organization._count.products}/${plan.maxProducts}`)
    }

    if (plan.maxBranches && organization._count.branches > plan.maxBranches) {
      violations.push(`Límite de sucursales excedido: ${organization._count.branches}/${plan.maxBranches}`)
    }

    return {
      isValid: violations.length === 0,
      violations
    }
  }
}
