import { redirect } from "next/navigation"

import { ReportsPageClient } from "@/components/sales/reports/reports-page-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

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

  return <ReportsPageClient customerSlug={slug} />
}

