import { NextRequest, NextResponse } from 'next/server'
import { PermissionAdminService } from '@/lib/services/admin/permission-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'

// GET - Obtener todos los permisos
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar permisos
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'permisos_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar permisos' }, { status: 403 })
    }

    const permissions = await PermissionAdminService.getAllPermissions()
    return NextResponse.json(permissions)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PERMISSIONS' }))
  }
}

// POST - Registrar nuevos permisos
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear permisos
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'permisos_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear permisos' }, { status: 403 })
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
    const modules = PermissionAdminService.getAvailableModules()
    const availableActions = PermissionAdminService.getAvailableActions()

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
      const parts = permName.split('_')
      const permModule = parts[0] || module
      const permAction = parts.slice(1).join('_') || 'unknown'
      
      return {
        name: permName,
        module: permModule,
        action: permAction,
        description: PermissionAdminService.generatePermissionDescription(permModule, permAction),
      }
    })

    // Crear permisos en la tabla
    await PermissionAdminService.createPermissions(permissionsToCreate)

    return NextResponse.json({
      success: true,
      message: `Se registraron ${permissions.length} permiso(s) correctamente`,
      permissions,
      module,
      actions,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_PERMISSIONS' }))
  }
}
