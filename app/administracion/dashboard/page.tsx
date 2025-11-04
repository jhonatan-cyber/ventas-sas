import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminService } from "@/lib/services/admin/admin-service"
import { AuthService } from "@/lib/services/auth-service"
import { DashboardService } from "@/lib/services/admin/dashboard-service"
import { DashboardClient } from "@/components/admin/dashboard/dashboard-client"
import { AdminAnalyticsClient } from "@/components/analytics/admin-analytics-client"

export default async function AdminPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  if (!token) {
    redirect('/administracion/login')
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect('/administracion/login')
  }
  // Opcional: validar super admin
  const profile = await AuthService.getProfileById(payload.userId)
  if (!profile || !profile.isSuperAdmin) {
    redirect('/administracion/login')
  }

  // Get comprehensive admin statistics
  const [dashboardStats, recentActivity, growthStats, systemMetrics, healthMetrics] = await Promise.all([
    AdminService.getDashboardStats(),
    DashboardService.getRecentActivity('30d', 20),
    AdminService.getGrowthStats(),
    AdminService.getSystemMetrics(),
    DashboardService.getHealthMetrics().catch(() => null), // Si falla, retornar null
  ])

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