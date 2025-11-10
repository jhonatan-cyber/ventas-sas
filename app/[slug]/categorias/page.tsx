import { redirect } from "next/navigation"

import { CategoriesPageClient } from "@/components/sales/category/categories-page-client"
import { CategoryService } from "@/lib/services/sales/category-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function CategoriesPage({
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

  // Obtener categorías
  const result = await CategoryService.getAllCategories(organizationId, 0, 1000)
  const categories = result.categories

  return <CategoriesPageClient initialCategories={categories} customerSlug={slug} />
}

