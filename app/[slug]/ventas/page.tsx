import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SalesPageClient } from "@/components/sales/sale/sales-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { SaleService } from "@/lib/services/sales/sale-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

const serializeSale = (sale: any) => ({
  id: sale.id,
  organizationId: sale.organizationId,
  userId: sale.userId,
  customerId: sale.customerId,
  customerName: sale.customerName ?? null,
  saleNumber: sale.saleNumber,
  status: sale.status,
  subtotal: Number(sale.subtotal ?? 0),
  discount: Number(sale.discount ?? 0),
  total: Number(sale.total ?? 0),
  paymentMethod: sale.paymentMethod,
  notes: sale.notes ?? null,
  createdAt: sale.createdAt ? sale.createdAt.toISOString() : null,
  updatedAt: sale.updatedAt ? sale.updatedAt.toISOString() : null,
  customer: sale.customer
    ? {
        id: sale.customer.id,
        name: sale.customer.name,
        lastName: sale.customer.lastName,
        email: sale.customer.email,
        phone: sale.customer.phone,
      }
    : null,
  user: sale.user
    ? {
        id: sale.user.id,
        fullName: sale.user.fullName,
        email: sale.user.email,
      }
    : null,
  items: sale.items?.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    subtotal: Number(item.subtotal ?? 0),
    trackingCodes: Array.isArray(item.trackingCodes) ? item.trackingCodes : null,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price ?? 0),
          imageUrl: item.product.imageUrl ?? null,
        }
      : null,
  })),
})

export default async function SalesPage({
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

  const cookieStore = await cookies()
  const token = cookieStore.get('sas-auth-token')?.value
  const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null
  const serializedUser = currentUser
    ? {
        id: currentUser.id,
        nombre: currentUser.nombre,
        apellido: currentUser.apellido,
        email: currentUser.email,
        sucursalId: currentUser.sucursalId ?? null,
        sucursal: currentUser.sucursal
          ? {
              id: currentUser.sucursal.id,
              name: currentUser.sucursal.name ?? null,
            }
          : null,
      }
    : null

  // Si no hay organizationId, usar array vacío en lugar de redirigir
  const sales = organizationId
    ? (await SaleService.getAllSales(organizationId, 0, 1000)).sales.map(serializeSale)
    : []

  return (
    <SalesPageClient
      initialSales={sales}
      customerSlug={slug}
      currentUser={serializedUser}
    />
  )
}
