import { redirect } from "next/navigation"

import { ExpensesReportClient } from "@/components/sales/reports/expenses-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function ExpensesReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <ExpensesReportClient customerSlug={slug} />
}

