import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { RolesPageClient } from "@/components/admin/role/roles-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { RoleAdminService } from "@/lib/services/admin/role-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function RolesPage() {
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

    // Verificar permiso específico para listar roles
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'roles_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener roles
    const roles = await RoleAdminService.getAllRoles()

    return <RolesPageClient initialRoles={roles} />
  } catch  {
    redirect('/administracion/login')
  }
}