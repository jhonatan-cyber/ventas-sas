import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { PermissionsPageClient } from "@/components/admin/permission/permissions-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { PermissionAdminService } from "@/lib/services/admin/permission-admin-service"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function PermissionsPage() {
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

    // Verificar permiso específico para listar permisos
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'permisos_listar')
    if (!canList) {
      redirect("/administracion/dashboard?error=no_permission")
    }
  } catch {
    redirect("/administracion/login")
  }

  // Obtener permisos y estadísticas con manejo de errores
  let permissions: any[] = []
  let stats: any = {
    totalPermissions: 0,
    systemPermissions: 0,
    customPermissions: 0,
    permissionsByCategory: {},
    mostUsedPermissions: [],
    unusedPermissions: [],
  }

  try {
    const [permissionsResult, statsResult] = await Promise.all([
      PermissionAdminService.getAllPermissions().catch((err) => {
        console.error('Error fetching permissions:', err)
        return []
      }),
      PermissionAdminService.getPermissionStats().catch((err) => {
        console.error('Error fetching permission stats:', err)
        return stats
      }),
    ])

    // Serializar permisos de forma segura
    permissions = (permissionsResult || []).map((perm: any) => {
      try {
        return {
          name: String(perm.name || ''),
          description: String(perm.description || ''),
          category: String(perm.category || ''),
          roles: Array.isArray(perm.roles) 
            ? perm.roles.map((r: any) => String(r))
            : [],
          roleCount: Number(perm.roleCount || 0),
          isSystem: Boolean(perm.isSystem ?? false),
          isActive: perm.isActive === null || perm.isActive === undefined 
            ? undefined 
            : Boolean(perm.isActive),
        }
      } catch (permError) {
        console.error('Error mapping permission:', permError, perm)
        return null
      }
    }).filter((perm): perm is NonNullable<typeof perm> => perm !== null)

    // Serializar estadísticas de forma segura
    if (statsResult) {
      stats = {
        totalPermissions: Number(statsResult.totalPermissions || 0),
        systemPermissions: Number(statsResult.systemPermissions || 0),
        customPermissions: Number(statsResult.customPermissions || 0),
        permissionsByCategory: typeof statsResult.permissionsByCategory === 'object' && statsResult.permissionsByCategory !== null
          ? Object.fromEntries(
              Object.entries(statsResult.permissionsByCategory).map(([key, value]) => [
                String(key),
                Number(value || 0)
              ])
            )
          : {},
        mostUsedPermissions: Array.isArray(statsResult.mostUsedPermissions)
          ? statsResult.mostUsedPermissions.map((perm: any) => ({
              name: String(perm.name || ''),
              description: String(perm.description || ''),
              category: String(perm.category || ''),
              roles: Array.isArray(perm.roles) 
                ? perm.roles.map((r: any) => String(r))
                : [],
              roleCount: Number(perm.roleCount || 0),
              isSystem: Boolean(perm.isSystem ?? false),
              isActive: perm.isActive === null || perm.isActive === undefined 
                ? undefined 
                : Boolean(perm.isActive),
            }))
          : [],
        unusedPermissions: Array.isArray(statsResult.unusedPermissions)
          ? statsResult.unusedPermissions.map((perm: any) => ({
              name: String(perm.name || ''),
              description: String(perm.description || ''),
              category: String(perm.category || ''),
              roles: Array.isArray(perm.roles) 
                ? perm.roles.map((r: any) => String(r))
                : [],
              roleCount: Number(perm.roleCount || 0),
              isSystem: Boolean(perm.isSystem ?? false),
              isActive: perm.isActive === null || perm.isActive === undefined 
                ? undefined 
                : Boolean(perm.isActive),
            }))
          : [],
      }
    }
  } catch (error) {
    console.error('Error loading permissions data:', error)
    permissions = []
    stats = {
      totalPermissions: 0,
      systemPermissions: 0,
      customPermissions: 0,
      permissionsByCategory: {},
      mostUsedPermissions: [],
      unusedPermissions: [],
    }
  }

  return <PermissionsPageClient initialPermissions={permissions} initialStats={stats} />
}

