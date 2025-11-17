import { redirect } from "next/navigation"

import { AiReportPageClient } from "@/components/sales/reports/ai-report-client"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function AiReportsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/reportes`)
  }

  return <AiReportPageClient customerSlug={slug} />
}


