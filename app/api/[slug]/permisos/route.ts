import { NextRequest, NextResponse } from 'next/server'

import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

// GET - Obtener todos los permisos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que el usuario tenga permiso para gestionar permisos
    await requirePermission(request, slug, EXTRA_PERMISSIONS.PERMISOS_MANAGE)

    const permissions = await PermissionSasService.getAllPermissions(organizationId)
    return NextResponse.json(permissions)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PERMISSIONS_SAS' }))
  }
}

// POST - Registrar nuevos permisos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar permiso para gestionar permisos
    await requirePermission(request, slug, EXTRA_PERMISSIONS.PERMISOS_MANAGE)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const { module, actions, permissions } = body

    // Validar que se proporcionen los datos necesarios
    if (!module || !actions || !Array.isArray(actions) || actions.length === 0) {
      throw AppError.validation('Debe proporcionar un módulo y al menos una acción')
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      throw AppError.validation('Debe proporcionar al menos un permiso')
    }

    // Validar que los permisos sean válidos
    const modules = PermissionSasService.getAvailableModules()
    const availableActions = PermissionSasService.getAvailableActions()

    if (!modules.find(m => m.id === module)) {
      throw AppError.validation(`Módulo inválido: ${module}`)
    }

    for (const action of actions) {
      if (!availableActions.find(a => a.id === action)) {
        throw AppError.validation(`Acción inválida: ${action}`)
      }
    }

    // Preparar permisos para crear
    const permissionsToCreate = permissions.map((permName: string) => {
      const parts = permName.split("_")
      const permModule = parts[0] || module
      const permAction = parts.slice(1).join('_') || 'unknown'
      
      return {
        name: permName,
        module: permModule,
        action: permAction,
        description: PermissionSasService.generatePermissionDescription(permModule, permAction),
      }
    })

    // Crear permisos en la tabla
    await PermissionSasService.createPermissions(permissionsToCreate)

    return NextResponse.json({
      success: true,
      message: `Se registraron ${permissions.length} permiso(s) correctamente`,
      permissions,
      module,
      actions,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_PERMISSIONS_SAS' }))
  }
}

