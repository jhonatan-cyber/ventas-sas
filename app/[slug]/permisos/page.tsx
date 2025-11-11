import { redirect } from "next/navigation"

import { PermissionsSasPageClient } from "@/components/sales/permission/permissions-sas-page-client"
import { PermissionSasService } from "@/lib/services/sales/permission-sas-service"
import { getOrganizationIdByCustomerSlug, getMaxBranchesBySlug } from "@/lib/utils/organization"

export default async function PermisosPage({
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

  // Obtener límite de sucursales del plan
  const maxBranches = await getMaxBranchesBySlug(slug)

  // Obtener permisos y estadísticas
  const [permissions, stats] = await Promise.all([
    PermissionSasService.getAllPermissions(organizationId),
    PermissionSasService.getPermissionStats(organizationId),
  ])

  return <PermissionsSasPageClient initialPermissions={permissions} initialStats={stats} customerSlug={slug} maxBranches={maxBranches} />
}

