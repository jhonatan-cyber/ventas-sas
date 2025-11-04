import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { SystemConfigClient } from "@/components/admin/system-config/system-config-client"
import { SystemConfigService } from "@/lib/services/admin/system-config-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function AdminSetupPage() {
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
  
  // Validar super admin
  const profile = await AuthService.getProfileById(payload.userId)
  if (!profile || !profile.isSuperAdmin) {
    redirect('/administracion/login')
  }

  // Obtener datos iniciales
  const [config, jwtSecrets, initialMetrics] = await Promise.all([
    SystemConfigService.getSystemConfig(),
    SystemConfigService.getJwtSecrets(),
    SystemConfigService.getSystemMetrics()
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Configuración del Sistema
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona la configuración general, seguridad, JWT secrets, logs y métricas del sistema
          </p>
        </div>

        <SystemConfigClient
          initialConfig={config}
          initialJwtSecrets={jwtSecrets}
          initialMetrics={initialMetrics}
        />
      </div>
    </AdminLayout>
  )
}
