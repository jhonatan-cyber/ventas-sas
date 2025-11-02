import { redirect } from "next/navigation"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { ExpensesReportClient } from "@/components/sales/reports/expenses-report-client"

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

