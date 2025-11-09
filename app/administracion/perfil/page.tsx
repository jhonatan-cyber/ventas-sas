import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AuthService } from "@/lib/services/auth-service"
import { ProfilePageClient } from "@/components/admin/profile/profile-page-client"

export default async function ProfilePage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  
  if (!token) {
    redirect('/administracion/login')
  }
  
  try {
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      redirect('/administracion/login')
    }
    
    // Validar acceso de administrador
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      redirect('/administracion/login?error=no_access')
    }
    
    // Obtener perfil del usuario actual
    const profile = await AuthService.getProfileById(payload.userId)
    
    if (!profile) {
      redirect('/administracion/login')
    }

    return (
      <AdminLayout>
        <ProfilePageClient initialProfile={profile} />
      </AdminLayout>
    )
  } catch (error) {
    redirect('/administracion/login')
  }
}
