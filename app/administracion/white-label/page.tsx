import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { AdminLayout } from '@/components/layout/admin-layout'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { WhiteLabelClient } from '@/components/admin/white-label/white-label-client'

export default async function WhiteLabelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value

  if (!token) {
    redirect('/administracion/login')
  }

  const payload = await AdminJWTService.verifyToken(token)
  if (!payload) {
    redirect('/administracion/login')
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect('/administracion/login')
  }

  const organizations = await OrganizationAdminService.getAllOrganizations()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">White Label</h1>
          <p className="text-muted-foreground">
            Personaliza el branding y la apariencia para cada organización
          </p>
        </div>
        <WhiteLabelClient initialOrganizations={organizations} />
      </div>
    </AdminLayout>
  )
}
