import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { BulkNotificationsClient } from "@/components/admin/notifications/bulk-notifications-client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { OrganizationAdminService } from "@/lib/services/admin/organization-admin-service"

export default async function NotificationsPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value
  if (!token) {
    redirect("/administracion/login")
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect("/administracion/login")
  }

  // Obtener organizaciones para el selector
  const organizations = await OrganizationAdminService.getAllOrganizations()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Notificaciones Masivas
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Envía notificaciones a múltiples usuarios, organizaciones o todos los administradores
          </p>
        </div>

        <BulkNotificationsClient organizations={organizations} />
      </div>
    </AdminLayout>
  )
}
