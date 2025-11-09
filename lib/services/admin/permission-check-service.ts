import { prisma } from '@/lib/prisma'
import { PermissionAdminService } from './permission-admin-service'

/**
 * Servicio para verificar si un usuario tiene un permiso específico y activo
 */
export class PermissionCheckService {
  /**
   * Verifica si un usuario tiene un permiso específico y que ese permiso esté activo
   * @param userId ID del usuario
   * @param permissionName Nombre del permiso a verificar (ej: "delete_users")
   * @returns true si el usuario tiene el permiso Y el permiso está activo, false en caso contrario
   */
  static async hasActivePermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Obtener el perfil del usuario
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
      })

      if (!profile || !profile.isActive) {
        return false
      }

      // Super admin siempre tiene todos los permisos
      if (profile.isSuperAdmin) {
        return true
      }

      // Si no tiene rol, no tiene permisos
      if (!profile.role) {
        return false
      }

      // Obtener el rol del usuario
      const role = await prisma.role.findFirst({
        where: { name: profile.role },
      })

      if (!role) {
        return false
      }

      // Obtener permisos del rol
      const rolePermissions = (role.permissions as string[]) || []

      // Verificar si el rol tiene el permiso
      if (!rolePermissions.includes(permissionName)) {
        return false
      }

      // Verificar si el permiso está activo en la tabla Permission
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
        select: { isActive: true },
      })

      // Si el permiso no existe en la tabla, no está activo
      if (!permission) {
        return false
      }

      // El permiso está activo si isActive es true
      return permission.isActive
    } catch (error) {
      console.error('[PermissionCheckService] Error checking permission:', error)
      return false
    }
  }

  /**
   * Verifica si un usuario tiene al menos uno de los permisos especificados y que esté activo
   * @param userId ID del usuario
   * @param permissionNames Array de nombres de permisos
   * @returns true si el usuario tiene al menos uno de los permisos activos
   */
  static async hasAnyActivePermission(userId: string, permissionNames: string[]): Promise<boolean> {
    for (const permissionName of permissionNames) {
      if (await this.hasActivePermission(userId, permissionName)) {
        return true
      }
    }
    return false
  }

  /**
   * Verifica si un usuario tiene todos los permisos especificados y que estén activos
   * @param userId ID del usuario
   * @param permissionNames Array de nombres de permisos
   * @returns true si el usuario tiene todos los permisos activos
   */
  static async hasAllActivePermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    for (const permissionName of permissionNames) {
      if (!(await this.hasActivePermission(userId, permissionName))) {
        return false
      }
    }
    return true
  }
}

