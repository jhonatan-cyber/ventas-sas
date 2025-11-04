import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AbTestsClient } from '@/components/admin/ab-tests/ab-tests-client'
import { AbTestService } from '@/lib/services/admin/ab-test-service'

export default async function AbTestsPage() {
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

  const { tests } = await AbTestService.getTests()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pruebas A/B</h1>
          <p className="text-muted-foreground">
            Crea y gestiona pruebas A/B para planes, precios y features
          </p>
        </div>
        <AbTestsClient initialTests={tests} />
      </div>
    </AdminLayout>
  )
}

