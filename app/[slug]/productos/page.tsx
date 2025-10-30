import { redirect } from "next/navigation"
import { ProductsPageClient } from "@/components/sales/product/products-page-client"
import { SalesProductService } from "@/lib/services/sales/sales-product-service"
import { CategoryService } from "@/lib/services/sales/category-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function ProductsPage({
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

  // Obtener productos y categorías
  const [productsResult, categories] = await Promise.all([
    SalesProductService.getAllProducts(organizationId, 0, 1000),
    CategoryService.getActiveCategories(organizationId)
  ])

  return (
    <ProductsPageClient 
      initialProducts={productsResult.products} 
      categories={categories}
      customerSlug={slug} 
    />
  )
}

