import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"
import { AdminLayout } from "@/components/layout/admin-layout"
import { CacheManager } from "@/components/admin/cache/cache-manager"

export default async function CachePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  if (!token) {
    redirect('/administracion/login')
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect('/administracion/login')
  }

  const profile = await AuthService.getProfileById(payload.userId)
  if (!profile || !profile.isSuperAdmin) {
    redirect('/administracion/login')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <CacheManager />
      </div>
    </AdminLayout>
  )
}
