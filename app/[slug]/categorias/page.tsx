import { redirect } from "next/navigation"
import { CategoriesPageClient } from "@/components/sales/category/categories-page-client"
import { CategoryService } from "@/lib/services/sales/category-service"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function CategoriesPage({
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

  // Obtener categorías
  const result = await CategoryService.getAllCategories(customer.id, 0, 1000)
  const categories = result.categories

  return <CategoriesPageClient initialCategories={categories} customerSlug={slug} />
}

