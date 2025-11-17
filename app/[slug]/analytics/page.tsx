import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/login`)
  }

  // Verificar sesión
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("sas-session")

  if (!sessionCookie) {
    redirect(`/${slug}/login`)
  }

  let session: any = null
  try {
    const value = sessionCookie.value
    let decoded: string
    try {
      decoded = Buffer.from(value, 'base64').toString('utf8')
      session = JSON.parse(decoded)
    } catch {
      session = JSON.parse(value)
    }
  } catch {
    redirect(`/${slug}/login`)
  }

  // Verificar que la sesión corresponde a la organización correcta
  if (session.organizationSlug !== slug) {
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)

  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  return <AnalyticsPageClient organizationId={organizationId} customerSlug={slug} />
}

