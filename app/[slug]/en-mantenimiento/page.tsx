import { Wrench, Clock, Mail, Phone, Calendar, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function EnMantenimientoPage({
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

  // Verificar si existe una página CMS publicada que sirva como landing para esta organización
  const landingPage = await prisma.cmsPage.findFirst({
    where: {
      slug: slug,
      pageType: {
        in: ['landing', 'home']
      },
      isPublished: true,
      publishedAt: {
        not: null
      }
    }
  })

  // Solo redirigir al landing si tiene suscripción activa Y tiene landing configurado
  if (activeSubscription && landingPage) {
    redirect(`/${slug}`)
  }

  // Obtener la última suscripción para mostrar información
  const lastSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id
    },
    orderBy: {
      endDate: 'desc'
    }
  })

  // Formatear fecha de vencimiento si existe
  const endDate = lastSubscription?.endDate
    ? new Date(lastSubscription.endDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  // Determinar el mensaje según el estado
  const isExpired = lastSubscription?.endDate && new Date(lastSubscription.endDate) < new Date()
  const mainMessage = isExpired 
    ? "Sitio Temporalmente Inactivo"
    : "Sitio en Mantenimiento"
  
  const subMessage = isExpired
    ? "Este sitio está temporalmente inactivo. Por favor, contacta con nosotros para más información."
    : "Estamos trabajando en mejoras para ofrecerte una mejor experiencia."

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-amber-300/20 dark:bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="relative w-full max-w-3xl border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <CardHeader className="text-center pb-6 pt-8">
          {/* Icono animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
                <Wrench className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
            {mainMessage}
          </CardTitle>
          <CardDescription className="text-xl font-medium text-slate-600 dark:text-slate-400">
            {organization.razonSocial || organization.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Mensaje principal */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-600/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-amber-900 dark:text-amber-200 font-medium mb-1">
                  {subMessage}
                </p>
                <p className="text-amber-700/80 dark:text-amber-300/80 text-sm">
                  Disculpa las molestias ocasionadas. Agradecemos tu comprensión.
                </p>
              </div>
            </div>
          </div>

          {/* Información de tiempo */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-4 py-3 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-medium">
                Estaremos de vuelta pronto
              </span>
            </div>

            {endDate && (
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-4 py-3 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium">
                  {endDate}
                </span>
              </div>
            )}
          </div>

          {/* Sección de contacto mejorada */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Nuestro equipo está disponible para asistirte
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                asChild
              >
                <a href="mailto:soporte@empresa.com">
                  <Mail className="h-6 w-6 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-white">Email</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Escríbenos</div>
                  </div>
                </a>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700 transition-all group"
                asChild
              >
                <a href="tel:+1234567890">
                  <Phone className="h-6 w-6 text-green-500 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-white">Teléfono</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Llámanos</div>
                  </div>
                </a>
              </Button>
            </div>
          </div>

          {/* Footer con mensaje adicional */}
          <div className="text-center pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Gracias por tu paciencia y confianza
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}