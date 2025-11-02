import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { QuotationsPageClient } from "@/components/sales/quotation/quotations-page-client"
import { QuotationService } from "@/lib/services/sales/quotation-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"
import { BranchService } from "@/lib/services/sales/branch-service"
import type { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

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

  const branches = await BranchService.getActiveBranches(customer.id)

  const cookieStore = await cookies()
  const sessionRaw = cookieStore.get('sas-session')?.value
  let currentRole: string | null = null
  if (sessionRaw) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionRaw))
      currentRole = session?.rol ?? null
    } catch {}
  }

  const isAdmin = currentRole?.toLowerCase() === 'administrador'
  const showBranchColumn = isAdmin && branches.length > 1

  // Obtener cotizaciones
  const result = await QuotationService.getAllQuotations(organizationId, 0, 1000)
  const quotations: SalesQuotationWithRelations[] = result.quotations.map((quotation) => ({
    ...quotation,
    customerId: quotation.customerId ?? null,
    subtotal: Number(quotation.subtotal ?? 0),
    discount: Number(quotation.discount ?? 0),
    total: Number(quotation.total ?? 0),
    customerName: quotation.customerName ?? null,
    customer: quotation.customer
      ? {
          id: quotation.customer.id,
          name: quotation.customer.name,
          lastName: quotation.customer.lastName ?? null,
          email: quotation.customer.email ?? null,
          phone: quotation.customer.phone ?? null,
          address: quotation.customer.address ?? null,
          ruc: quotation.customer.ruc ?? null,
        }
      : null,
    customerPhone: quotation.customerPhone ?? null,
    branchId: quotation.branchId ?? null,
    branch: quotation.branch
      ? {
          id: quotation.branch.id,
          name: quotation.branch.name,
          address: quotation.branch.address ?? null,
        }
      : null,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    expiresAt: quotation.expiresAt ? quotation.expiresAt.toISOString() : null,
    items: quotation.items?.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      product: item.product
        ? {
            ...item.product,
            price: Number(item.product.price ?? 0),
          }
        : null,
    })) ?? [],
  }))

  return (
    <QuotationsPageClient 
      initialQuotations={quotations} 
      customerSlug={slug}
      organizationId={slug}
      showBranchColumn={showBranchColumn}
    />
  )
}

