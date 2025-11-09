import { NextRequest, NextResponse } from 'next/server'
import { PermissionAdminService } from '@/lib/services/admin/permission-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'

// PATCH - Activar o desactivar un permiso
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { name } = await params
    const permissionName = decodeURIComponent(name)

    if (!permissionName) {
      throw AppError.validation('El nombre del permiso es requerido')
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      throw AppError.validation('El campo isActive debe ser un booleano')
    }

    // Verificar permiso según la acción (activar o desactivar)
    const requiredPermission = isActive ? 'permisos_activar' : 'permisos_desactivar'
    const canToggle = await PermissionCheckService.hasActivePermission(currentUser.id, requiredPermission)
    if (!canToggle) {
      return NextResponse.json({ 
        error: `No tiene permiso para ${isActive ? 'activar' : 'desactivar'} permisos` 
      }, { status: 403 })
    }

    // Verificar que el permiso existe
    const permissionExists = await PermissionAdminService.isValidPermission(permissionName)

    if (!permissionExists) {
      throw AppError.notFound(`El permiso "${permissionName}" no existe`)
    }

    // Actualizar estado del permiso
    await PermissionAdminService.togglePermissionStatus(permissionName, isActive)

    return NextResponse.json({
      success: true,
      message: `El permiso "${permissionName}" ha sido ${isActive ? 'activado' : 'desactivado'} correctamente`,
      permissionName,
      isActive,
    }, { status: 200 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'TOGGLE_PERMISSION_STATUS' }))
  }
}
