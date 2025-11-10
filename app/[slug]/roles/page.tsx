import { redirect } from "next/navigation"

import { RolesSasPageClient } from "@/components/sales/role/roles-sas-page-client"
import { RoleSasService } from "@/lib/services/sales/role-sas-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function RolesPage({
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

  // Obtener roles
  const result = await RoleSasService.getAllRoles(organizationId, 0, 1000)
  const roles = result.roles

  return <RolesSasPageClient initialRoles={roles} customerSlug={slug} />
}

