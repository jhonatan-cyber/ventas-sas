import { redirect } from "next/navigation"

import { SalesLayoutClient } from "@/components/layout/sales-layout-client"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/utils/i18n-provider"
import { getMaxBranchesBySlug, getModulesBySlug } from "@/lib/utils/organization"
import { prisma } from "@/lib/prisma"

export default async function SalesLayout({
  children,
  params,
}: {
  children: React.ReactNode
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
  
  // Obtener límite de sucursales para ocultar el módulo en el sidebar si es necesario
  const maxBranches = await getMaxBranchesBySlug(slug)
  
  // Obtener módulos permitidos según el plan suscrito
  const allowedModules = await getModulesBySlug(slug)
  
  // Nota: La validación de suscripción se hará en cada página individual según corresponda
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="sas-theme">
      <I18nProvider>
        <SalesLayoutClient organizationSlug={slug} maxBranches={maxBranches} allowedModules={allowedModules}>
          {children}
        </SalesLayoutClient>
      </I18nProvider>
    </ThemeProvider>
  )
}
