import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { CustomDomainsClient } from '@/components/admin/custom-domains/custom-domains-client'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { CustomDomainService } from '@/lib/services/admin/custom-domain-service'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { AuthService } from '@/lib/services/auth-service'

export default async function CustomDomainsPage() {
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

  const [domains, organizations] = await Promise.all([
    CustomDomainService.getDomains(),
    OrganizationAdminService.getAllOrganizations(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dominios Personalizados</h1>
          <p className="text-muted-foreground">
            Configura y gestiona dominios personalizados para organizaciones
          </p>
        </div>
        <CustomDomainsClient initialDomains={domains.domains} initialOrganizations={organizations} />
      </div>
    </AdminLayout>
  )
}

