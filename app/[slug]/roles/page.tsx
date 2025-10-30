import { redirect } from "next/navigation"
import { RolesSasPageClient } from "@/components/sales/role/roles-sas-page-client"
import { RoleSasService } from "@/lib/services/sales/role-sas-service"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function RolesPage({
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

  // Obtener roles
  const result = await RoleSasService.getAllRoles(customer.id, 0, 1000)
  const roles = result.roles

  return <RolesSasPageClient initialRoles={roles} customerSlug={slug} />
}

