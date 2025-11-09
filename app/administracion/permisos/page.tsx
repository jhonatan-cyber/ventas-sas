import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { PermissionsPageClient } from "@/components/admin/permission/permissions-page-client"
import { PermissionAdminService } from "@/lib/services/admin/permission-admin-service"
import { AuthService } from "@/lib/services/auth-service"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"

export default async function PermissionsPage() {
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

    // Verificar permiso específico para listar permisos
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'permisos_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener permisos y estadísticas
    const [permissions, stats] = await Promise.all([
      PermissionAdminService.getAllPermissions(),
      PermissionAdminService.getPermissionStats(),
    ])

    return <PermissionsPageClient initialPermissions={permissions} initialStats={stats} />
  } catch (error) {
    redirect('/administracion/login')
  }
}

