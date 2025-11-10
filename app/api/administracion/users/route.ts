import { NextRequest, NextResponse } from 'next/server'

import { PasswordService } from '@/lib/auth/password'
import { AppError } from '@/lib/errors/app-error'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createUserSchema } from '@/lib/validators/admin-validators'

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar usuarios
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'usuarios_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar usuarios' }, { status: 403 })
    }

    const users = await UserAdminService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_USERS_ADMIN' }))
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario actual para verificar permisos
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      throw AppError.unauthorized('No autorizado')
    }

    // Verificar permiso de crear usuarios
    const hasPermission = await PermissionCheckService.hasActivePermission(
      currentUser.id,
      'usuarios_crear'
    )
    if (!hasPermission) {
      throw AppError.forbidden('No tienes permiso para crear usuarios')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createUserSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const hashedPassword = await PasswordService.hashPassword(validatedData.password)

    const newUser = await UserAdminService.createUser({
      email: validatedData.email,
      password: hashedPassword,
      ci: validatedData.ci || undefined,
      fullName: validatedData.fullName,
      address: validatedData.address || undefined,
      phone: validatedData.phone || undefined,
      role: validatedData.role,
      roleId: undefined, // TODO: agregar roleId al schema si es necesario
      isSuperAdmin: validatedData.isSuperAdmin || false,
      photo: validatedData.photo || undefined
    })

    // Registrar creación de usuario en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          actionType: 'USER_CREATED',
          entityType: 'User',
          entityId: newUser.id,
          details: {
            newUserEmail: newUser.email,
            role: validatedData.role,
            isSuperAdmin: validatedData.isSuperAdmin || false,
          },
        },
        request
      )
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_USER_ADMIN' }))
  }
}

