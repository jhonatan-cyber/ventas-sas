import { redirect } from "next/navigation"
import { BranchesPageClient } from "@/components/sales/branch/branches-page-client"
import { BranchService } from "@/lib/services/sales/branch-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

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

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener sucursales
  const result = await BranchService.getAllBranches(organizationId, 0, 1000)
  const branches = result.branches

  return (
    <BranchesPageClient 
      initialBranches={branches} 
      customerSlug={slug} 
    />
  )
}

