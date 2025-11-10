import { redirect } from "next/navigation"

import { GeneralReportClient } from "@/components/sales/reports/general-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function GeneralReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <GeneralReportClient customerSlug={slug} />
}

