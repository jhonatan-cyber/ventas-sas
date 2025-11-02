import { NextRequest, NextResponse } from 'next/server'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { PasswordService } from '@/lib/auth/password'
import { createUserSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const users = await UserAdminService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_USERS_ADMIN' }))
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
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

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentAdminUser(request)

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
      isSuperAdmin: validatedData.isSuperAdmin || false
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

