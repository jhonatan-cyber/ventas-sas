import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ConfiguracionClient } from "./configuracion-client"

import { prisma } from "@/lib/prisma"
import { getCustomerBySlug } from "@/lib/utils/organization"

export const dynamic = 'force-dynamic'

async function getActiveSubscriptionForOrganization(organizationId?: string | null) {
  if (!organizationId) return null

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: { in: ['active', 'trial'] },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  return subscription
}

export default async function ConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const session = cookieStore.get("sas-session")
  if (!session) redirect(`/${slug}/login`)

  const customer = await getCustomerBySlug(slug)
  if (!customer) redirect("/")

  const organizationId = customer.primaryOrganization?.id
  const activeSubscription = await getActiveSubscriptionForOrganization(organizationId)

  // Calcular precio del plan según período
  const planPrice = activeSubscription?.plan 
    ? (activeSubscription.billingPeriod === 'yearly' 
        ? activeSubscription.plan.priceYearly 
        : activeSubscription.plan.priceMonthly)
    : null

  return (
    <ConfiguracionClient
      customerSlug={slug}
      customer={{
        ci: customer.ci,
        nombre: customer.nombre,
        apellido: customer.apellido,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        primaryOrganization: customer.primaryOrganization ? {
          id: customer.primaryOrganization.id,
          name: customer.primaryOrganization.name,
          slug: customer.primaryOrganization.slug,
          razonSocial: customer.primaryOrganization.razonSocial,
          nit: customer.primaryOrganization.nit,
          address: customer.primaryOrganization.address,
          phone: customer.primaryOrganization.phone,
          website: customer.primaryOrganization.website,
          logoUrl: customer.primaryOrganization.logoUrl,
        } : null,
      }}
      activeSubscription={activeSubscription ? {
        status: activeSubscription.status,
        endDate: activeSubscription.endDate,
        billingPeriod: activeSubscription.billingPeriod,
        plan: {
          name: activeSubscription.plan?.name ?? null,
        },
      } : null}
      planPrice={planPrice ? Number(planPrice).toFixed(2) : ""}
    />
  )
}

