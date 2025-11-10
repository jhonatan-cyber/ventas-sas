import { redirect } from "next/navigation"

import { OrganizationLandingClient } from "@/components/landing/organization-landing-client"
import { prisma } from "@/lib/prisma"

export default async function OrganizationLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar directamente en la base de datos si la organización existe (por slug)
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      customerOrganizations: {
        where: { isActive: true },
        include: {
          customer: true
        }
      }
    }
  })
  
  // Si la organización NO existe, redirigir a la raíz
  if (!organization) {
    redirect('/')
  }

  // Validar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    redirect('/')
  }

  // Verificar si existe al menos una suscripción activa en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      status: {
        in: ['active', 'trial']
      },
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } }
      ]
    }
  })

  // Verificar si alguna vez tuvo una suscripción
  const hasAnySubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id
    }
  })

  // Si no tiene suscripción activa ni registrada, redirigir a la raíz
  if (!activeSubscription && !hasAnySubscription) {
    redirect('/')
  }

  // Si tuvo suscripciones pero ninguna está activa, mostrar página de mantenimiento
  if (hasAnySubscription && !activeSubscription) {
    redirect(`/${slug}/en-mantenimiento`)
  }

  // Verificar si existe una página CMS publicada que sirva como landing para esta organización
  // Buscamos páginas con pageType 'landing' o 'home' que estén publicadas y pertenezcan a esta organización
  const landingPage = await prisma.cmsPage.findFirst({
    where: {
      organizationId: organization.id,
      pageType: {
        in: ['landing', 'home']
      },
      isPublished: true,
      publishedAt: {
        not: null
      }
    }
  })

  // Si tiene suscripción activa pero no tiene landing configurado para esta organización, redirigir a mantenimiento
  if (activeSubscription && !landingPage) {
    redirect(`/${slug}/en-mantenimiento`)
  }

  // Mostrar el landing de la empresa (conectado al CMS)
  return (
    <OrganizationLandingClient 
      organizationSlug={slug}
      organization={organization}
      landingPage={landingPage ? {
        title: landingPage.title,
        content: landingPage.content,
        excerpt: landingPage.excerpt,
        template: landingPage.template || "minimal",
        publishedAt: landingPage.publishedAt,
      } : null}
    />
  )
}

