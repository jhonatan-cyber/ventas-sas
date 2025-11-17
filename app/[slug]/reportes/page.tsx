import { redirect } from "next/navigation"

import { ReportsPageClient } from "@/components/sales/reports/reports-page-client"
import { getCustomerBySlug, getMaxBranchesBySlug } from "@/lib/utils/organization"

export default async function ReportsPage({
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

  // Obtener el límite de sucursales para determinar el tipo de reportes
  const maxBranches = await getMaxBranchesBySlug(slug)

  return <ReportsPageClient customerSlug={slug} maxBranches={maxBranches} />
}

