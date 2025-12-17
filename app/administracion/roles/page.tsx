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
  const token = cookieStore.get("admin-auth-token")?.value
  
  if (!token) {
    redirect("/administracion/login")
  }
  
  try {
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      redirect("/administracion/login")
    }
    
    // Validar acceso de administrador
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      redirect("/administracion/login?error=no_access")
    }

    // Verificar permiso específico para listar roles
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'roles_listar')
    if (!canList) {
      redirect("/administracion/dashboard?error=no_permission")
    }
  } catch {
    redirect("/administracion/login")
  }

  // Obtener roles con manejo de errores
  let roles: any[] = []

  try {
    const rolesResult = await RoleAdminService.getAllRoles().catch((err) => {
      console.error('Error fetching roles:', err)
      return []
    })

    // Serializar roles de forma segura
    roles = (rolesResult || []).map((role: any) => {
      try {
        return {
          id: String(role.id || ''),
          name: String(role.name || ''),
          description: role.description === null || role.description === undefined 
            ? undefined 
            : String(role.description),
          permissions: role.permissions 
            ? (Array.isArray(role.permissions) 
                ? role.permissions.map((p: any) => String(p))
                : typeof role.permissions === 'object'
                  ? JSON.parse(JSON.stringify(role.permissions))
                  : [])
            : [],
          isActive: Boolean(role.isActive ?? true),
          createdAt: role.createdAt instanceof Date 
            ? role.createdAt.toISOString() 
            : String(role.createdAt || new Date().toISOString()),
          _count: {
            organizationMembers: Number(role._count?.organizationMembers || 0),
            adminUsers: Number(role._count?.adminUsers || 0),
          },
        }
      } catch (roleError) {
        console.error('Error mapping role:', roleError, role)
        return null
      }
    }).filter((role): role is NonNullable<typeof role> => role !== null)
  } catch (error) {
    console.error('Error loading roles data:', error)
    roles = []
  }

  return <RolesPageClient initialRoles={roles} />
}