import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// DELETE - Eliminar un permiso
export async function DELETE(
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

    // Verificar que el permiso existe y pertenece al sistema SAS
    const permissionExists = await PermissionSasService.isValidPermission(permissionName)

    if (!permissionExists) {
      throw AppError.notFound(`El permiso "${permissionName}" no existe o no pertenece al sistema SAS`)
    }

    // Obtener todos los roles SAS de la organización que tienen este permiso
    const roles = await prisma.roleSas.findMany({
      where: {
        organizationId,
        deletedAt: null,
        nombre: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
      select: {
        id: true,
        nombre: true,
        permissions: true,
      },
    })

    // Actualizar todos los roles que tienen este permiso
    const rolesToUpdate = roles.filter(role => {
      const permissions = (role.permissions as string[]) || []
      return permissions.includes(permissionName)
    })

    // Eliminar el permiso de todos los roles
    for (const role of rolesToUpdate) {
      const currentPermissions = (role.permissions as string[]) || []
      const updatedPermissions = currentPermissions.filter(p => p !== permissionName)

      await prisma.roleSas.update({
        where: { id: role.id },
        data: {
          permissions: updatedPermissions,
        },
      })
    }

    // Eliminar el permiso de la tabla
    await PermissionSasService.deletePermission(permissionName)

    return NextResponse.json({
      success: true,
      message: `El permiso "${permissionName}" ha sido eliminado de ${rolesToUpdate.length} rol(es) y de la base de datos`,
      permissionName,
      rolesAffected: rolesToUpdate.map(r => r.nombre),
      rolesCount: rolesToUpdate.length,
    }, { status: 200 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_PERMISSION_SAS' }))
  }
}

