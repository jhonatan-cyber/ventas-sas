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
  const perms = await UserPermissionsService.getUserPermissions(slug)

  if (!perms || !perms.isAuthenticated) {
    throw AppError.unauthorized('No autenticado')
  }

  const roleName = perms.roleName || ''
  if (roleName && /admin|administrador|administrator/i.test(roleName)) {
    return // admin: acceso completo
  }

  const required = Array.isArray(permissionOrList) ? permissionOrList : [permissionOrList]

  const has = required.some(r => perms.permissions.includes(r))
  if (!has) {
    throw AppError.forbidden('No autorizado')
  }
}

export default requirePermission
