import { redirect } from "next/navigation"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { ProductsReportClient } from "@/components/sales/reports/products-report-client"

export default async function ProductsReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  return <ProductsReportClient customerSlug={slug} />
}

