import { redirect } from "next/navigation"

import { BranchesReportClient } from "@/components/sales/reports/branches-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function BranchesReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <BranchesReportClient customerSlug={slug} />
}


