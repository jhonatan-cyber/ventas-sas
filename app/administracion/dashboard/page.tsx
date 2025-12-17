import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardClient } from "@/components/admin/dashboard/dashboard-client"
import { AdminAnalyticsClient } from "@/components/analytics/admin-analytics-client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminService } from "@/lib/services/admin/admin-service"
import { DashboardService } from "@/lib/services/admin/dashboard-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function AdminPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value
  
  if (!token) {
    redirect("/administracion/login")
  }
  
  try {
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      // Si el token es inválido, redirigir (el logout se encargará de eliminar la cookie)
      redirect("/administracion/login")
    }
    
    // Validar acceso de administrador (super admin o rol Administrador)
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      // Si el usuario no tiene acceso de administrador, redirigir con mensaje de error
      redirect("/administracion/login?error=no_access")
    }
  } catch {
    // Si hay error al verificar token, redirigir
    redirect("/administracion/login")
  }

  // Get comprehensive admin statistics with error handling
  let dashboardStats: any = null
  let recentActivity: any = null
  let _growthStats: any = null
  let systemMetrics: any = null
  let healthMetrics: any = null
  
  try {
    const results = await Promise.allSettled([
      AdminService.getDashboardStats(),
      DashboardService.getRecentActivity('30d', 20),
      AdminService.getGrowthStats(),
      AdminService.getSystemMetrics(),
      DashboardService.getHealthMetrics().catch(() => null),
    ])
    
    dashboardStats = results[0].status === 'fulfilled' ? results[0].value : {
      organizations: { total: 0, active: 0, suspended: 0, trial: 0 },
      users: { total: 0, active: 0, inactive: 0, superAdmins: 0 },
      roles: { total: 0, withUsers: 0, withoutUsers: 0 },
      plans: { total: 0, active: 0, inactive: 0, totalOrganizations: 0 },
      revenue: { total: 0, monthly: 0, yearly: 0 }
    }
    
    recentActivity = results[1].status === 'fulfilled' ? results[1].value : []
    
    _growthStats = results[2].status === 'fulfilled' ? results[2].value : {
      organizations: { current: 0, monthlyGrowth: 0, yearlyGrowth: 0 },
      users: { current: 0, monthlyGrowth: 0, yearlyGrowth: 0 }
    }
    
    systemMetrics = results[3].status === 'fulfilled' ? results[3].value : {
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      totalUsers: 0,
      totalRevenue: 0
    }
    
    healthMetrics = results[4].status === 'fulfilled' ? results[4].value : null
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Valores por defecto en caso de error
    dashboardStats = {
      organizations: { total: 0, active: 0, suspended: 0, trial: 0 },
      users: { total: 0, active: 0, inactive: 0, superAdmins: 0 },
      roles: { total: 0, withUsers: 0, withoutUsers: 0 },
      plans: { total: 0, active: 0, inactive: 0, totalOrganizations: 0 },
      revenue: { total: 0, monthly: 0, yearly: 0 }
    }
    recentActivity = []
    _growthStats = {
      organizations: { current: 0, monthlyGrowth: 0, yearlyGrowth: 0 },
      users: { current: 0, monthlyGrowth: 0, yearlyGrowth: 0 }
    }
    systemMetrics = {
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      totalUsers: 0,
      totalRevenue: 0
    }
    healthMetrics = null
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
            Panel de Administración
          </h1>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
            Gestiona organizaciones, usuarios, planes y configuración del sistema
          </p>
        </div>

        {/* Dashboard mejorado con filtros, alertas, salud y actividad */}
        <DashboardClient
          initialStats={dashboardStats}
          initialMetrics={systemMetrics}
          initialActivity={recentActivity}
          initialHealth={healthMetrics || undefined}
        />

        {/* Analytics */}
        <div className="space-y-3 md:space-y-4">
          <AdminAnalyticsClient />
        </div>
      </div>
    </AdminLayout>
  )
}