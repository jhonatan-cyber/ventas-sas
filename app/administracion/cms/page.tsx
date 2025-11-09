import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { AdminLayout } from '@/components/layout/admin-layout'
import { CmsClient } from '@/components/admin/cms/cms-client'
import { CmsService } from '@/lib/services/admin/cms-service'

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

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect('/administracion/login')
  }

  // Cargar datos iniciales
  const { pages, total: pagesTotal } = await CmsService.getPages()
  const { posts, total: postsTotal } = await CmsService.getBlogPosts()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Contenido (CMS)</h1>
          <p className="text-muted-foreground">
            Administra páginas estáticas y entradas de blog
          </p>
        </div>
        <CmsClient initialPages={pages} initialPagesTotal={pagesTotal} initialPosts={posts} initialPostsTotal={postsTotal} />
      </div>
    </AdminLayout>
  )
}
