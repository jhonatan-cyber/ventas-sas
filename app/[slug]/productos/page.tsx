import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ProductsPageClient } from "@/components/sales/product/products-page-client"
import { CategoryService } from "@/lib/services/sales/category-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Obtener organizationId desde el slug
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener sucursal del usuario logueado desde la sesión
  let branchId: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("sas-session")
    
    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf8')
        const session = JSON.parse(decoded)
        branchId = session.sucursalId || undefined
      } catch (e) {
        // Si hay error al decodificar, continuar sin branchId
      }
    }
  } catch (e) {
    // Si hay error al obtener cookies, continuar sin branchId
  }

  // Obtener todas las categorías activas de la organización
  // Las categorías se muestran todas, independientemente de si tienen productos en la sucursal
  // El filtrado por sucursal se aplica solo a los productos, no a las categorías
  const categories = await CategoryService.getActiveCategories(organizationId)

  return (
    <ProductsPageClient 
      initialCategories={categories}
      customerSlug={slug} 
    />
  )
}

