"use client"

import { usePermissionsContext } from '@/contexts/permissions-context'

export interface UserPermissions {
  permissions: string[]
  isSuperAdmin: boolean
  isLoading: boolean
}

/**
 * Hook para obtener los permisos del usuario logueado
 * Usa el contexto global de permisos que se carga una vez al iniciar sesión
 */
export function useUserPermissions(): UserPermissions {
  const context = usePermissionsContext()
  return {
    permissions: context.permissions,
    isSuperAdmin: context.isSuperAdmin,
    isLoading: context.isLoading,
  }
}

/**
 * Hook para verificar si el usuario tiene un permiso específico
 */
export function useHasPermission(permissionName: string): boolean {
  const { permissions, isSuperAdmin } = useUserPermissions()

  if (isSuperAdmin) {
    return true
  }

  return permissions.includes(permissionName)
}

/**
 * Hook para verificar si el usuario tiene al menos uno de los permisos especificados
 */
export function useHasAnyPermission(permissionNames: string[]): boolean {
  const { permissions, isSuperAdmin } = useUserPermissions()

  if (isSuperAdmin) {
    return true
  }

  return permissionNames.some(permission => permissions.includes(permission))
}

/**
 * Hook para verificar si el usuario tiene todos los permisos especificados
 */
export function useHasAllPermissions(permissionNames: string[]): boolean {
  const { permissions, isSuperAdmin } = useUserPermissions()

  if (isSuperAdmin) {
    return true
  }

  return permissionNames.every(permission => permissions.includes(permission))
}

