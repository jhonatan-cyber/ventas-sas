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
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)

  // Obtener clientes del sistema de ventas - Si no hay organizationId, usar array vacío en lugar de redirigir
  const salesCustomers = organizationId
    ? (await SalesCustomerService.getAllCustomers(organizationId, 0, 1000)).customers
    : []

  return (
    <SalesCustomersPageClient 
      initialCustomers={salesCustomers} 
      customerSlug={slug} 
    />
  )
}

