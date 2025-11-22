import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SupportTicketsPageClient } from "@/components/sales/support/support-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { SupportTicketSasService } from "@/lib/services/sales/support-ticket-sas-service"
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function SupportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/login`)
  }

  const cookieStore = await cookies()
  const token = cookieStore.get("sas-auth-token")?.value

  if (!token) {
    redirect(`/${slug}/login`)
  }

  const currentUser = await AuthSasService.verifyToken(slug, token)
  if (!currentUser) {
    redirect(`/${slug}/login`)
  }

  // Cargar más tickets inicialmente para permitir filtrado local
  const [{ tickets, total }, stats] = await Promise.all([
    SupportTicketSasService.listTickets(organizationId, { take: 1000 }),
    SupportTicketSasService.getStats(organizationId),
  ])

  const serializedUser = {
    id: currentUser.id,
    nombre: currentUser.nombre || null,
    apellido: currentUser.apellido || null,
    email: currentUser.email || null,
    phone: currentUser.phone || null,
  }

  return (
    <SupportTicketsPageClient
      customerSlug={slug}
      currentUser={serializedUser}
      initialTickets={tickets}
      initialTotal={total}
      initialStats={stats}
    />
  )
}

