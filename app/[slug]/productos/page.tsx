import { redirect } from "next/navigation"

import { ProductsPageClient } from "@/components/sales/product/products-page-client"
import { CategoryService } from "@/lib/services/sales/category-service"
import { SalesProductService } from "@/lib/services/sales/sales-product-service"
import { getOrganizationIdByCustomerSlug, getMaxProductsBySlug } from "@/lib/utils/organization"

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

  // Obtener límite de productos del plan
  const maxProducts = await getMaxProductsBySlug(slug)

  // Obtener el total de productos de la organización (sin filtros de categoría o sucursal)
  // Esto es para verificar el límite del plan
  const { total: totalProducts } = await SalesProductService.getAllProducts(
    organizationId,
    0,
    1, // Solo necesitamos el total, no los productos
    undefined, // sin búsqueda
    undefined, // sin filtro de estado
    undefined, // sin filtro de categoría
    undefined, // sin filtro de sucursal
    false // no incluir eliminados
  )

  // Obtener todas las categorías activas de la organización
  // Las categorías se muestran todas, independientemente de si tienen productos en la sucursal
  // El filtrado por sucursal se aplica solo a los productos, no a las categorías
  const categories = await CategoryService.getActiveCategories(organizationId)

  return (
    <ProductsPageClient 
      initialCategories={categories}
      customerSlug={slug}
      maxProducts={maxProducts}
      totalProducts={totalProducts}
    />
  )
}

