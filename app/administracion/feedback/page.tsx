import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { FeedbackClient } from '@/components/admin/feedback/feedback-client'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { FeedbackService } from '@/lib/services/admin/feedback-service'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { AuthService } from '@/lib/services/auth-service'

export default async function FeedbackPage() {
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

  const [initialFeedbacks, stats, organizations] = await Promise.all([
    FeedbackService.getFeedbacks({ page: 1, pageSize: 20 }),
    FeedbackService.getFeedbackStats(),
    OrganizationAdminService.getAllOrganizations(),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Feedback de Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona las sugerencias y comentarios de los usuarios
          </p>
        </div>
        <FeedbackClient
          initialFeedbacks={initialFeedbacks}
          initialStats={stats}
          initialOrganizations={organizations}
        />
      </div>
    </AdminLayout>
  )
}
