import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"
import { AdminLayout } from "@/components/layout/admin-layout"
import { ExportWizard } from "@/components/admin/data-export/export-wizard"

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

  const profile = await AuthService.getProfileById(payload.userId)
  if (!profile || !profile.isSuperAdmin) {
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
