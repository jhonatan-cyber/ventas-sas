import { redirect } from "next/navigation"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { CashRegistersReportClient } from "@/components/sales/reports/cash-registers-report-client"

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

