import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { CategoriesPageClient } from "@/components/sales/category/categories-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
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

  // Obtener usuario actual
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

  // Obtener categorías
  // Si es administrador, mostrar todas las categorías
  // Si no es administrador, mostrar solo categorías que tienen productos en su sucursal
  const branchId = isAdmin ? null : currentUserBranchId
  const result = await CategoryService.getAllCategories(organizationId, 0, 1000, undefined, undefined, branchId)
  const categories = result.categories

  return <CategoriesPageClient initialCategories={categories} customerSlug={slug} />
}

