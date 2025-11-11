import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// PATCH - Activar o desactivar un permiso
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; name: string }> }
) {
  try {
    const { slug, name } = await params
    const permissionName = decodeURIComponent(name)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    if (!permissionName) {
      throw AppError.validation('El nombre del permiso es requerido')
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      throw AppError.validation('El campo isActive debe ser un booleano')
    }

    // Verificar que el permiso existe y pertenece al sistema SAS
    const permissionExists = await PermissionSasService.isValidPermission(permissionName)

    if (!permissionExists) {
      throw AppError.notFound(`El permiso "${permissionName}" no existe o no pertenece al sistema SAS`)
    }

    // Actualizar estado del permiso
    await PermissionSasService.togglePermissionStatus(permissionName, isActive)

    return NextResponse.json({
      success: true,
      message: `El permiso "${permissionName}" ha sido ${isActive ? 'activado' : 'desactivado'} correctamente`,
      permissionName,
      isActive,
    }, { status: 200 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'TOGGLE_PERMISSION_STATUS_SAS' }))
  }
}

