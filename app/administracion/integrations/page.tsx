import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { IntegrationsClient } from '@/components/admin/integrations/integrations-client'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { IntegrationService } from '@/lib/services/admin/integration-service'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { AuthService } from '@/lib/services/auth-service'

export default async function IntegrationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value

  if (!token) {
    redirect("/administracion/login")
  }

  const payload = await AdminJWTService.verifyToken(token)
  if (!payload) {
    redirect("/administracion/login")
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect("/administracion/login")
  }

  const [integrations, organizations] = await Promise.all([
    IntegrationService.getIntegrations(),
    OrganizationAdminService.getAllOrganizations(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace de Integraciones</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo de integraciones disponibles para las organizaciones
          </p>
        </div>
        <IntegrationsClient initialIntegrations={integrations.integrations} initialOrganizations={organizations} />
      </div>
    </AdminLayout>
  )
}

