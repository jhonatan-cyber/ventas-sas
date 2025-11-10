import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { RoleAdminService } from '@/lib/services/admin/role-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createRoleSchema } from '@/lib/validators/admin-validators'

// GET - Obtener todos los roles
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar roles
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'roles_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar roles' }, { status: 403 })
    }

    const roles = await RoleAdminService.getAllRoles()
    return NextResponse.json(roles)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_ROLES_ADMIN' }))
  }
}

// POST - Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear roles
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'roles_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear roles' }, { status: 403 })
    }
    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createRoleSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Validar permisos si se proporcionan (validación adicional del servicio)
    if (validatedData.permissions && Array.isArray(validatedData.permissions) && validatedData.permissions.length > 0) {
      const permissionValidation = await RoleAdminService.validatePermissions(validatedData.permissions)
      if (!permissionValidation.isValid) {
        throw AppError.validation(`Permisos inválidos: ${permissionValidation.invalidPermissions.join(', ')}`)
      }
    }

    const newRole = await RoleAdminService.createRole({
      name: validatedData.name,
      description: validatedData.description || undefined,
      permissions: validatedData.permissions || []
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_ROLE_ADMIN' }))
  }
}

