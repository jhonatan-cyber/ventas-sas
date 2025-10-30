import { OrganizationAdminService } from './organization-admin-service'
import { UserAdminService } from './user-admin-service'
import { RoleAdminService } from './role-admin-service'
import { SubscriptionAdminService } from './subscription-admin-service'
import { prisma } from '@/lib/prisma'

export interface AdminDashboardStats {
  organizations: {
    total: number
    active: number
    suspended: number
    trial: number
  }
  users: {
    total: number
    active: number
    inactive: number
    superAdmins: number
  }
  roles: {
    total: number
    withUsers: number
    withoutUsers: number
  }
  plans: {
    total: number
    active: number
    inactive: number
    totalOrganizations: number
  }
  revenue: {
    total: number
    monthly: number
    yearly: number
  }
}

export interface RecentActivity {
  id: string
  type: 'user_created' | 'organization_created' | 'order_created' | 'plan_changed'
  description: string
  timestamp: Date
  userId?: string
  organizationId?: string
}

export class AdminService {
  // Obtener estadísticas del dashboard
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    const [orgStats, userStats, roleStats, planStats] = await Promise.all([
      OrganizationAdminService.getOrganizationStats(),
      UserAdminService.getUserStats(),
      RoleAdminService.getRoleStats(),
      SubscriptionAdminService.getPlanStats()
    ])

    // Calcular ingresos
    const revenueData = await SubscriptionAdminService.getRevenueByPlan()
    const totalRevenue = revenueData.reduce((sum, plan) => sum + plan.totalRevenue, 0)

    return {
      organizations: orgStats,
      users: userStats,
      roles: roleStats,
      plans: planStats,
      revenue: {
        total: totalRevenue,
        monthly: totalRevenue, // Simplificado - en producción calcular por período
        yearly: totalRevenue * 12
      }
    }
  }

  // Obtener actividad reciente (simulado - en producción sería de logs reales)
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    // En una implementación real, esto vendría de una tabla de logs
    const recentUsers = await UserAdminService.getRecentUsers(5)
    const recentOrgs = await prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    const activities: RecentActivity[] = []

    // Simular actividad reciente
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_created',
        description: `Nuevo usuario: ${user.fullName || user.email}`,
        timestamp: user.createdAt,
        userId: user.id
      })
    })

    recentOrgs.forEach(org => {
      activities.push({
        id: `org-${org.id}`,
        type: 'organization_created',
        description: `Nueva organización: ${org.name}`,
        timestamp: org.createdAt,
        organizationId: org.id
      })
    })

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Obtener estadísticas de crecimiento
  static async getGrowthStats() {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const [currentOrgs, lastMonthOrgs, lastYearOrgs] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({
        where: { createdAt: { lte: lastMonth } }
      }),
      prisma.organization.count({
        where: { createdAt: { lte: lastYear } }
      })
    ])

    const [currentUsers, lastMonthUsers, lastYearUsers] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: { createdAt: { lte: lastMonth } }
      }),
      prisma.profile.count({
        where: { createdAt: { lte: lastYear } }
      })
    ])

    return {
      organizations: {
        current: currentOrgs,
        monthlyGrowth: currentOrgs - lastMonthOrgs,
        yearlyGrowth: currentOrgs - lastYearOrgs
      },
      users: {
        current: currentUsers,
        monthlyGrowth: currentUsers - lastMonthUsers,
        yearlyGrowth: currentUsers - lastYearUsers
      }
    }
  }

  // Obtener métricas de uso del sistema
  static async getSystemMetrics() {
    const [totalOrders, totalProducts, totalCustomers, totalUsers] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.profile.count()
    ])

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true }
    })

    return {
      totalOrders,
      totalProducts,
      totalCustomers,
      totalUsers,
      totalRevenue: totalRevenue._sum.total?.toNumber() || 0
    }
  }

  // Buscar en todo el sistema
  static async globalSearch(query: string) {
    const [organizations, users, roles, plans] = await Promise.all([
      OrganizationAdminService.searchOrganizations(query),
      UserAdminService.searchUsers(query),
      RoleAdminService.searchRoles(query),
      SubscriptionAdminService.searchPlans(query)
    ])

    return {
      organizations,
      users,
      roles,
      plans,
      totalResults: organizations.length + users.length + roles.length + plans.length
    }
  }

  // Obtener logs del sistema (simulado)
  static async getSystemLogs(limit: number = 50) {
    // En una implementación real, esto vendría de una tabla de logs
    return [
      {
        id: '1',
        level: 'info',
        message: 'Sistema iniciado correctamente',
        timestamp: new Date(),
        userId: 'system'
      },
      {
        id: '2',
        level: 'info',
        message: 'Nueva organización creada',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        userId: 'admin'
      },
      {
        id: '3',
        level: 'warning',
        message: 'Límite de usuarios alcanzado en organización',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        userId: 'system'
      }
    ].slice(0, limit)
  }

  // Exportar datos del sistema
  static async exportSystemData() {
    const [organizations, users, roles, plans] = await Promise.all([
      OrganizationAdminService.getAllOrganizations(),
      UserAdminService.getAllUsers(),
      RoleAdminService.getAllRoles(),
      SubscriptionAdminService.getAllPlans()
    ])

    return {
      organizations,
      users,
      roles,
      plans,
      exportedAt: new Date(),
      totalRecords: organizations.length + users.length + roles.length + plans.length
    }
  }

  // Limpiar datos de prueba
  static async cleanupTestData() {
    // Eliminar datos de prueba (organizaciones con nombre que contenga "test" o "demo")
    const testOrganizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { name: { contains: 'demo', mode: 'insensitive' } }
        ]
      }
    })

    for (const org of testOrganizations) {
      await OrganizationAdminService.deleteOrganization(org.id)
    }

    return { deletedOrganizations: testOrganizations.length }
  }
}

// Re-exportar todos los servicios para conveniencia
export {
  OrganizationAdminService,
  UserAdminService,
  RoleAdminService,
  SubscriptionAdminService
}
