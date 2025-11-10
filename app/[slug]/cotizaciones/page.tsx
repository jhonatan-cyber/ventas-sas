import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import type { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

import { QuotationsPageClient } from "@/components/sales/quotation/quotations-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { BranchService } from "@/lib/services/sales/branch-service"
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
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)

  const cookieStore = await cookies()
  const token = cookieStore.get("sas-auth-token")?.value
  let currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

  if (!currentUser) {
    const sessionCookie = cookieStore.get("sas-session")?.value
    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie, "base64").toString("utf8")
        const session = JSON.parse(decoded)
        currentUser = {
          sucursalId: session.sucursalId ?? null,
          sucursal: session.sucursalId ? { id: session.sucursalId } : null,
          rol: session.rol ? { nombre: session.rol } : null,
        } as any
      } catch (error) {
        console.error("No se pudo decodificar la cookie de sesión", error)
      }
    }
  }

  const currentUserBranchId = currentUser?.sucursalId || currentUser?.sucursal?.id || null
  const roleName = currentUser?.rol?.nombre?.toLowerCase() || ""
  const isAdmin = roleName.includes("administrador") || roleName === "admin"

  const rawBranches = organizationId
    ? await BranchService.getActiveBranches(organizationId)
    : []

  const serializedBranches = rawBranches.map((branch: any) => ({
    id: branch.id,
    name: branch.name ?? "Sin sucursal",
    address: branch.address ?? null,
  }))

  const showBranchColumn = isAdmin && serializedBranches.length > 1
  const allowBranchFilter = isAdmin

  const normalizeQuotation = (quotation: any): SalesQuotationWithRelations => ({
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
      productName: item.productName ?? null,
      product: item.product
        ? {
          ...item.product,
          price: Number(item.product.price ?? 0),
        }
        : null,
    })) ?? [],
  })

  // Obtener cotizaciones - Si no hay organizationId, usar array vacío en lugar de redirigir
  const quotations: SalesQuotationWithRelations[] = organizationId
    ? (await QuotationService.getAllQuotations(organizationId, 1, 1000)).quotations.map(normalizeQuotation)
    : []

  return (
    <QuotationsPageClient
      initialQuotations={quotations}
      customerSlug={slug}
      organizationId={organizationId ?? slug}
      showBranchColumn={showBranchColumn}
      canFilterByBranch={allowBranchFilter}
      initialBranches={serializedBranches}
      initialIsAdmin={isAdmin}
      initialUserBranchId={currentUserBranchId}
    />
  )
}

