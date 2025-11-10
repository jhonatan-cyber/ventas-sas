import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { VersionsClient } from '@/components/admin/versions/versions-client'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { VersionService } from '@/lib/services/admin/version-service'
import { AuthService } from '@/lib/services/auth-service'

export default async function VersionsPage() {
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

  const [versions, currentVersion, stats] = await Promise.all([
    VersionService.getVersions(),
    VersionService.getCurrentVersion(),
    VersionService.getVersionStats(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Versiones</h1>
          <p className="text-muted-foreground">
            Administra versiones del sistema y notificaciones de actualizaciones
          </p>
        </div>
        <VersionsClient
          initialVersions={versions}
          initialCurrentVersion={currentVersion}
          initialStats={stats}
        />
      </div>
    </AdminLayout>
  )
}
