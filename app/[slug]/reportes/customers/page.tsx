import { redirect } from "next/navigation"

import { CustomersReportClient } from "@/components/sales/reports/customers-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function CustomersReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <CustomersReportClient customerSlug={slug} />
}

