import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SupportTicketDetailPageClient } from "@/components/sales/support/support-ticket-detail-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { SupportTicketSasService } from "@/lib/services/sales/support-ticket-sas-service"
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

interface TicketDetailPageProps {
  params: Promise<{ slug: string; ticketId: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { slug, ticketId } = await params

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

  const ticket = await SupportTicketSasService.getTicketById(ticketId, organizationId)
  if (!ticket) {
    redirect(`/${slug}/support`)
  }

  return (
    <SupportTicketDetailPageClient
      customerSlug={slug}
      initialTicket={ticket}
    />
  )
}

