import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ExportWizard } from "@/components/admin/data-export/export-wizard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"

export default async function ExportPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  if (!token) {
    redirect('/administracion/login')
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect('/administracion/login')
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect('/administracion/login')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Exportación de Datos
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Exporta datos del sistema en diferentes formatos
          </p>
        </div>

        <ExportWizard />
      </div>
    </AdminLayout>
  )
}
