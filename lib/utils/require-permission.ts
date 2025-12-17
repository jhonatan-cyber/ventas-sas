import { NextRequest } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { UserPermissionsService } from '@/lib/services/sales/user-permissions-service'

/**
 * Verifica permisos server-side para un usuario SAS.
 * - Si el usuario no está autenticado lanza `AppError.unauthorized`
 * - Si el rol es administrador permite el acceso
 * - Si no tiene el permiso solicitado lanza `AppError.forbidden`
 */
export async function requirePermission(request: NextRequest, slug: string, permissionOrList: string | string[]) {
  const perms = await UserPermissionsService.getUserPermissions(slug, request)

  if (!perms || !perms.isAuthenticated) {
    throw AppError.unauthorized('No autenticado')
  }

  // Si es administrador, permitir acceso completo sin verificar permisos específicos
  if (perms.isAdmin) {
    console.log('requirePermission - Admin access granted:', {
      userId: perms.userId,
      roleName: perms.roleName,
      isAdmin: perms.isAdmin
    })
    return // admin: acceso completo
  }

  const required = Array.isArray(permissionOrList) ? permissionOrList : [permissionOrList]

  const has = required.some(r => perms.permissions.includes(r))
  if (!has) {
    throw AppError.forbidden('No autorizado')
  }
}

export default requirePermission
