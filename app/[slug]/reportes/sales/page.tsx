import { redirect } from "next/navigation"

import { SalesReportClient } from "@/components/sales/reports/sales-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function SalesReportPage({
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

  return <SalesReportClient customerSlug={slug} />
}

