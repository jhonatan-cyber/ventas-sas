import { redirect } from "next/navigation"
import { ProductsPageClient } from "@/components/sales/product/products-page-client"
import { SalesProductService } from "@/lib/services/sales/sales-product-service"
import { CategoryService } from "@/lib/services/sales/category-service"
import { getCustomerBySlug } from "@/lib/utils/organization"

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

  // Obtener categorías activas
  const categories = await CategoryService.getActiveCategories(customer.id)

  return (
    <ProductsPageClient 
      initialCategories={categories}
      customerSlug={slug} 
    />
  )
}

