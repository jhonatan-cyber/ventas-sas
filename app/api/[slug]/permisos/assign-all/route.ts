import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// POST - Asignar todos los permisos a los roles Administrador
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Obtener todos los permisos registrados del sistema SAS
    const allPermissions = await PermissionSasService.getAllPermissions(organizationId)
    const permissionNames = allPermissions.map(p => p.name)

    if (permissionNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay permisos registrados para asignar',
        permissions: [],
      })
    }

    // Buscar los roles Administrador de la organización
    const adminRole = await prisma.roleSas.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        nombre: {
          contains: 'Administrador',
          mode: 'insensitive',
        },
      },
    })

    const rolesToUpdate: Array<{ role: any; name: string }> = []

    if (adminRole) {
      rolesToUpdate.push({ role: adminRole, name: adminRole.nombre })
    }

    // También buscar roles que contengan "Super" o "Super Admin"
    const superAdminRole = await prisma.roleSas.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        nombre: {
          contains: 'Super',
          mode: 'insensitive',
        },
      },
    })

    if (superAdminRole && superAdminRole.id !== adminRole?.id) {
      rolesToUpdate.push({ role: superAdminRole, name: superAdminRole.nombre })
    }

    if (rolesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Se encontraron ${permissionNames.length} permiso(s) registrados, pero no se encontraron roles "Administrador" o "Super Administrador" en la organización.`,
        permissions: permissionNames,
        totalPermissions: permissionNames.length,
      })
    }

    // Actualizar cada rol con todos los permisos registrados
    const updatePromises = rolesToUpdate.map(({ role }) => {
      const currentPermissions = (role.permissions as string[]) || []
      const updatedPermissions = [...new Set([...currentPermissions, ...permissionNames])]

      return prisma.roleSas.update({
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
    return handleApiError(error, createErrorContext(request, { action: 'ASSIGN_ALL_PERMISSIONS_SAS' }))
  }
}

