import { redirect } from "next/navigation"

import { CashRegistersReportClient } from "@/components/sales/reports/cash-registers-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function CashRegistersReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <CashRegistersReportClient customerSlug={slug} />
}

