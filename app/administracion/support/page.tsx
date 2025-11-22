import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SupportPageClient } from "@/components/admin/support/support-page-client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { prisma } from "@/lib/prisma"
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

  // Obtener información del usuario actual
  const currentUser = await prisma.profile.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
    },
  })

  // Verificar si el usuario es administrador o super administrador
  const isAdmin = currentUser?.isSuperAdmin || currentUser?.role?.toLowerCase() === 'administrador' || currentUser?.role?.toLowerCase() === 'admin'

  // Preparar filtros iniciales: si no es admin, solo mostrar tickets asignados al usuario
  const initialFilters = isAdmin ? {} : { assignedToId: currentUser?.id }

  // Obtener datos iniciales
  const [initialTickets, stats, organizations, admins] = await Promise.all([
    SupportService.getTickets(initialFilters, 0, 50),
    SupportService.getTicketStats(undefined, isAdmin ? undefined : currentUser?.id),
    OrganizationAdminService.getAllOrganizations(),
    SupportService.getAvailableAdmins(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SupportPageClient
          initialTickets={initialTickets.tickets}
          initialTotal={initialTickets.total}
          initialStats={stats}
          organizations={organizations.map(org => ({ id: org.id, name: org.name, slug: org.slug }))}
          admins={admins}
          isAdmin={isAdmin}
        />
      </div>
    </AdminLayout>
  )
}
