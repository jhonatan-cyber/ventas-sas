import { redirect } from "next/navigation"

import { BranchesPageClient } from "@/components/sales/branch/branches-page-client"
import { BranchService } from "@/lib/services/sales/branch-service"
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function BranchesPage({
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

  // Obtener organizationId
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener sucursales usando el servicio
  const { branches } = await BranchService.getAllBranches(
    organizationId,
    0,
    1000
  )

  return (
    <BranchesPageClient 
      initialBranches={branches} 
      customerSlug={slug} 
    />
  )
}

