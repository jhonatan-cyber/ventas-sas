import { redirect } from "next/navigation"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { GeneralReportClient } from "@/components/sales/reports/general-report-client"

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

