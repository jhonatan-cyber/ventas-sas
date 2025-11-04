import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { AdminLayout } from '@/components/layout/admin-layout'
import { CmsClient } from '@/components/admin/cms/cms-client'

export default async function CmsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value

  if (!token) {
    redirect('/administracion/login')
  }

  const payload = await AdminJWTService.verifyToken(token)
  if (!payload) {
    redirect('/administracion/login')
  }

  const user = await AuthService.getProfileById(payload.userId)
  if (!user || !user.isSuperAdmin) {
    redirect('/administracion/login')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Contenido (CMS)</h1>
          <p className="text-muted-foreground">
            Administra páginas estáticas y entradas de blog
          </p>
        </div>
        <CmsClient />
      </div>
    </AdminLayout>
  )
}
