import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { SecurityLogsService } from "@/lib/services/admin/security-logs-service"
import { AuthService } from "@/lib/services/auth-service"
import { LogsPageClient } from "@/components/admin/logs/logs-page-client"

export default async function LogsPage() {
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

  // Validar acceso de administrador (super admin o rol Administrador)
  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect('/administracion/login')
  }

  // Obtener datos iniciales
  const [initialLogs, initialStats] = await Promise.all([
    SecurityLogsService.getSecurityLogs({}, 0, 50),
    SecurityLogsService.getSecurityLogStats({}, 30),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Logs y Auditoría
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Visualiza y analiza los logs de seguridad del sistema
          </p>
        </div>

        <LogsPageClient
          initialLogs={initialLogs.logs}
          initialTotal={initialLogs.total}
          initialStats={initialStats}
        />
      </div>
    </AdminLayout>
  )
}
