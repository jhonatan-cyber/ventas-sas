import { getCachedData } from '@/lib/cache/cache-service'
import { prisma } from '@/lib/prisma'

export interface OrganizationGrowth {
  date: string
  count: number
}

export interface RevenueByPlan {
  planName: string
  organizations: number
  revenue: number
}

export interface UserActivity {
  date: string
  active: number
  new: number
}

export class AdminAnalyticsService {
  /**
   * Obtener crecimiento de organizaciones en el tiempo
   */
  static async getOrganizationGrowth(
    days: number = 90
  ): Promise<OrganizationGrowth[]> {
    const cacheKey = `admin:analytics:org-growth:${days}`

    return getCachedData(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - days)

        const organizations = await prisma.organization.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Agrupar por mes
        const grouped = new Map<string, number>()

        organizations.forEach((org) => {
          const date = new Date(org.createdAt)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          grouped.set(key, (grouped.get(key) || 0) + 1)
        })

        // Convertir a array y calcular acumulado
        const result: OrganizationGrowth[] = []
        let cumulative = 0

        // Obtener total antes del período
        const beforePeriod = await prisma.organization.count({
          where: {
            createdAt: {
              lt: startDate,
            },
          },
        })

        cumulative = beforePeriod

        const sortedKeys = Array.from(grouped.keys()).sort()
        sortedKeys.forEach((key) => {
          cumulative += grouped.get(key) || 0
          result.push({
            date: key,
            count: cumulative,
          })
        })

        return result
      },
      600 // Cache por 10 minutos
    )
  }

  /**
   * Obtener ingresos por plan
   */
  static async getRevenueByPlan(): Promise<RevenueByPlan[]> {
    const cacheKey = 'admin:analytics:revenue-by-plan'

    return getCachedData(
      cacheKey,
      async () => {
        const plans = await prisma.subscriptionPlan.findMany({
          include: {
            subscriptions: {
              where: {
                status: 'active',
              },
            },
          },
        })

        return plans.map((plan) => {
          const monthlyRevenue =
            (plan.priceMonthly ? Number(plan.priceMonthly) : 0) * plan.subscriptions.length
          return {
            planName: plan.name,
            organizations: plan.subscriptions.length,
            revenue: monthlyRevenue,
          }
        })
      },
      600 // Cache por 10 minutos
    )
  }

  /**
   * Obtener actividad de usuarios
   */
  static async getUserActivity(
    days: number = 30
  ): Promise<UserActivity[]> {
    const cacheKey = `admin:analytics:user-activity:${days}`

    return getCachedData(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - days)

        // Obtener usuarios nuevos
        const newUsers = await prisma.profile.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
          },
        })

        // Agrupar por día
        const grouped = new Map<string, { active: number; new: number }>()

        newUsers.forEach((user) => {
          const date = user.createdAt.toISOString().split("T")[0]
          const current = grouped.get(date) || { active: 0, new: 0 }
          grouped.set(date, {
            active: current.active,
            new: current.new + 1,
          })
        })

        // Rellenar días
        const result: UserActivity[] = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          const key = currentDate.toISOString().split("T")[0]
          const data = grouped.get(key) || { active: 0, new: 0 }

          result.push({
            date: key,
            active: data.active, // Simplificado - en producción calcular usuarios activos
            new: data.new,
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        return result
      },
      300 // Cache por 5 minutos
    )
  }
}

