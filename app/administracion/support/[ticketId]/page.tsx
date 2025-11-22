import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { TicketDetailPageClient } from "@/components/admin/support/ticket-detail-page-client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { prisma } from "@/lib/prisma"
import { SupportService } from "@/lib/services/admin/support-service"
import { AuthService } from "@/lib/services/auth-service"

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value
  if (!token) {
    redirect("/administracion/login")
  }

  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect("/administracion/login")
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect("/administracion/login")
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

  const { ticketId } = await params

  const [ticket, admins] = await Promise.all([
    SupportService.getTicketById(ticketId),
    SupportService.getAvailableAdmins(),
  ])

  if (!ticket) {
    redirect("/administracion/support")
  }

  return (
    <AdminLayout>
      <TicketDetailPageClient initialTicket={ticket} admins={admins} isAdmin={isAdmin} />
    </AdminLayout>
  )
}

