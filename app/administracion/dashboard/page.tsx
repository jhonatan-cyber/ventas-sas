import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, CreditCard, UserCog, TrendingUp, Activity, DollarSign, BarChart3, Zap, CheckCircle, XCircle } from "lucide-react"
import { AdminService } from "@/lib/services/admin/admin-service"
import { AuthService } from "@/lib/services/auth-service"
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
  const [dashboardStats, recentActivity, growthStats, systemMetrics] = await Promise.all([
    AdminService.getDashboardStats(),
    AdminService.getRecentActivity(5),
    AdminService.getGrowthStats(),
    AdminService.getSystemMetrics()
  ])

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Panel de Administración</h1>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">Gestiona organizaciones, usuarios, planes y configuración del sistema</p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Organizaciones</CardTitle>
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.organizations.total}</div>
              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Organizaciones en el sistema</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Activas</CardTitle>
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.organizations.active}</div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 mt-1">
                <span className="text-[10px] md:text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 md:px-2 py-0.5 rounded">Excelente</span>
                <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-500">
                  {Math.round((dashboardStats.organizations.active / dashboardStats.organizations.total) * 100)}% del total
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.round((dashboardStats.organizations.active / dashboardStats.organizations.total) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Inactivas</CardTitle>
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.organizations.suspended}</div>
              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dashboardStats.organizations.suspended > 0 
                  ? Math.round((dashboardStats.organizations.suspended / dashboardStats.organizations.total) * 100) 
                  : 0}% del total
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5">
                <div 
                  className="bg-red-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.round((dashboardStats.organizations.suspended / dashboardStats.organizations.total) * 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardStats.organizations.total > 0 && systemMetrics.totalUsers > 0
                  ? Math.round(systemMetrics.totalUsers / dashboardStats.organizations.total) 
                  : 0}
              </div>
              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Usuarios por organización</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de datos */}
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-lg text-gray-900 dark:text-white">Resumen del Sistema</CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Métricas generales del SaaS</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.users.total}</div>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Total Usuarios</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.totalProducts}</div>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Productos</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.totalOrders}</div>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Órdenes</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">${dashboardStats.revenue.total.toLocaleString()}</div>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">Ingresos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <div className="space-y-3 md:space-y-4">
          <AdminAnalyticsClient />
        </div>
      </div>
    </AdminLayout>
  )
}