import { Calendar, Mail, Phone, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function SuscripcionVencidaPage({
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
    redirect("/")
  }

  // Validar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    redirect("/")
  }

  // Verificar si tiene una suscripción activa en la tabla Subscription
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

  // Si tiene suscripción activa, redirigir al login
  if (activeSubscription) {
    redirect(`/${slug}/login`)
  }

  // Verificar si alguna vez tuvo una suscripción
  const hasAnySubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id
    }
  })

  // Si nunca tuvo suscripción, redirigir al login (no es una suscripción vencida)
  if (!hasAnySubscription) {
    redirect(`/${slug}/login`)
  }

  // Obtener la última suscripción para mostrar la fecha de vencimiento
  const lastSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id
    },
    orderBy: {
      endDate: 'desc'
    }
  })

  // Formatear fecha de vencimiento (usar la de la suscripción si está disponible)
  const endDate = lastSubscription?.endDate
    ? new Date(lastSubscription.endDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : organization.subscriptionEndDate
    ? new Date(organization.subscriptionEndDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1a1a] p-4">
      <Card className="w-full max-w-2xl border-red-200 dark:border-red-900/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Suscripción Vencida
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            {organization.razonSocial || organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-center">
              Tu suscripción ha vencido. Para continuar utilizando el servicio, 
              por favor renueva tu suscripción.
            </p>
          </div>

          {endDate && (
            <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm">
                Fecha de vencimiento: <strong>{endDate}</strong>
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              ¿Necesitas ayuda?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Contacta a tu proveedor de servicio</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>O comunícate con nuestro equipo de soporte</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto"
            >
              <a href="/contacto">Contactar Soporte</a>
            </Button>
            <Button
              asChild
              className="w-full sm:w-auto"
            >
              <a href={`/${slug}/login`}>Intentar Nuevamente</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

