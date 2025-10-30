import { redirect } from "next/navigation"
import { SalesCustomersPageClient } from "@/components/sales/customer/sales-customers-page-client"
import { SalesCustomerService } from "@/lib/services/sales/sales-customer-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function SalesCustomersPage({
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

  // Obtener clientes del sistema de ventas
  const result = await SalesCustomerService.getAllCustomers(organizationId, 0, 1000)
  const salesCustomers = result.customers

  return (
    <SalesCustomersPageClient 
      initialCustomers={salesCustomers} 
      customerSlug={slug} 
    />
  )
}

