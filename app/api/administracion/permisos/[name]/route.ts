import { NextRequest, NextResponse } from 'next/server'
import { PermissionAdminService } from '@/lib/services/admin/permission-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'

// DELETE - Eliminar un permiso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para eliminar permisos
    const canDelete = await PermissionCheckService.hasActivePermission(currentUser.id, 'permisos_eliminar')
    if (!canDelete) {
      return NextResponse.json({ error: 'No tiene permiso para eliminar permisos' }, { status: 403 })
    }

    const { name } = await params
    const permissionName = decodeURIComponent(name)

    if (!permissionName) {
      throw AppError.validation('El nombre del permiso es requerido')
    }

    // Verificar que el permiso existe en la tabla
    const permissionExists = await PermissionAdminService.isValidPermission(permissionName)

    if (!permissionExists) {
      throw AppError.notFound(`El permiso "${permissionName}" no existe`)
    }

    // Obtener todos los roles que tienen este permiso (excluyendo roles especiales)
    const roles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
      select: {
        id: true,
        name: true,
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

      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: updatedPermissions,
        },
      })
    }

    // Eliminar el permiso de la tabla
    await PermissionAdminService.deletePermission(permissionName)

    return NextResponse.json({
      success: true,
      message: `El permiso "${permissionName}" ha sido eliminado de ${rolesToUpdate.length} rol(es) y de la base de datos`,
      permissionName,
      rolesAffected: rolesToUpdate.map(r => r.name),
      rolesCount: rolesToUpdate.length,
    }, { status: 200 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_PERMISSION' }))
  }
}

