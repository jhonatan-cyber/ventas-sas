import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SupportPageClient } from "@/components/admin/support/support-page-client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { OrganizationAdminService } from "@/lib/services/admin/organization-admin-service"
import { SupportService } from "@/lib/services/admin/support-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function SupportPage() {
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
  const [initialTickets, stats, organizations, admins] = await Promise.all([
    SupportService.getTickets({}, 0, 50),
    SupportService.getTicketStats(),
    OrganizationAdminService.getAllOrganizations(),
    SupportService.getAvailableAdmins(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Tickets de Soporte
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los tickets de soporte de las organizaciones
          </p>
        </div>

        <SupportPageClient
          initialTickets={initialTickets.tickets}
          initialTotal={initialTickets.total}
          initialStats={stats}
          organizations={organizations.map(org => ({ id: org.id, name: org.name, slug: org.slug }))}
          admins={admins}
        />
      </div>
    </AdminLayout>
  )
}
