import { notFound, redirect } from "next/navigation"

import { TemplateRenderer } from "@/components/cms/templates/template-renderer"
import { prisma } from "@/lib/prisma"
import { CmsService } from "@/lib/services/admin/cms-service"

export default async function CmsPageView({
  params,
}: {
  params: Promise<{ slug: string; "page-slug": string }>
}) {
  const { slug, "page-slug": pageSlug } = await params

  // Verificar que la organización existe
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

  if (!organization) {
    redirect('/')
  }

  // Verificar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    redirect('/')
  }

  // Verificar si existe una suscripción activa
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

  if (!activeSubscription) {
    redirect(`/${slug}/en-mantenimiento`)
  }

  // Obtener la página CMS por slug
  const page = await CmsService.getPageBySlug(pageSlug, organization.id)

  // Si no existe o no está publicada, mostrar 404
  if (!page || !page.isPublished) {
    notFound()
  }

  // Renderizar la página con la plantilla seleccionada
  return (
    <TemplateRenderer
      template={page.template || "minimal"}
      title={page.title}
      excerpt={page.excerpt}
      content={page.content}
      organizationName={organization.razonSocial || organization.name}
    />
  )
}

