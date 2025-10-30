import { redirect } from "next/navigation"
import { QuotationsPageClient } from "@/components/sales/quotation/quotations-page-client"
import { QuotationService } from "@/lib/services/sales/quotation-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function QuotationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener cotizaciones
  const result = await QuotationService.getAllQuotations(organizationId, 0, 1000)
  const quotations = result.quotations

  return (
    <QuotationsPageClient 
      initialQuotations={quotations} 
      customerSlug={slug}
      organizationId={slug}
    />
  )
}

