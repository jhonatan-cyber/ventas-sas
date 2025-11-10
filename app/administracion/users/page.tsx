import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { UsersPageClient } from "@/components/admin/user/users-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { UserAdminService } from "@/lib/services/admin/user-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function UsersPage() {
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

    // Verificar permiso específico para listar usuarios
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'usuarios_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener usuarios
    const users = await UserAdminService.getAllUsers()

    return <UsersPageClient initialUsers={users} />
  } catch (error) {
    redirect('/administracion/login')
  }
}