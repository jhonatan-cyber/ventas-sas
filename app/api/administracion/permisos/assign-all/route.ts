import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { PermissionAdminService } from '@/lib/services/admin/permission-admin-service'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// POST - Asignar todos los permisos a los roles Administrador y Super Administrador
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para editar permisos (asignar permisos)
    const canEdit = await PermissionCheckService.hasActivePermission(currentUser.id, 'permisos_editar')
    if (!canEdit) {
      return NextResponse.json({ error: 'No tiene permiso para asignar permisos' }, { status: 403 })
    }
    // Obtener todos los permisos registrados
    const allPermissions = await PermissionAdminService.getAllPermissions()
    const permissionNames = allPermissions.map(p => p.name)

    if (permissionNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay permisos registrados para asignar',
        permissions: [],
      })
    }

    // Buscar los roles Administrador y Super Administrador
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador' },
    })

    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Administrador' },
    })

    const rolesToUpdate: Array<{ role: any; name: string }> = []

    if (adminRole) {
      rolesToUpdate.push({ role: adminRole, name: 'Administrador' })
    }

    if (superAdminRole) {
      rolesToUpdate.push({ role: superAdminRole, name: 'Super Administrador' })
    }

    if (rolesToUpdate.length === 0) {
      throw AppError.notFound('No se encontraron los roles "Administrador" o "Super Administrador"')
    }

    // Actualizar cada rol con todos los permisos registrados
    const updatePromises = rolesToUpdate.map(({ role, name }) => {
      const currentPermissions = (role.permissions as string[]) || []
      const updatedPermissions = [...new Set([...currentPermissions, ...permissionNames])]

      return prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: updatedPermissions,
        },
      })
    })

    await Promise.all(updatePromises)

    const roleNames = rolesToUpdate.map(r => r.name).join(' y ')
    const message = `Se han asignado ${permissionNames.length} permiso(s) a los roles "${roleNames}"`

    return NextResponse.json({
      success: true,
      message,
      permissions: permissionNames,
      roles: rolesToUpdate.map(r => r.name),
      totalPermissions: permissionNames.length,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'ASSIGN_ALL_PERMISSIONS' }))
  }
}
