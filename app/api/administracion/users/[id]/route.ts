import { NextRequest, NextResponse } from 'next/server'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { PasswordService } from '@/lib/auth/password'
import { updateUserSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await UserAdminService.getUserById(id)
    
    if (!user) {
      throw AppError.notFound('Usuario no encontrado')
    }

    return NextResponse.json(user)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_ADMIN_USER', userId: id }))
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(updateUserSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const updateData: any = {}
    
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.ci !== undefined) updateData.ci = validatedData.ci || null
    if (validatedData.fullName !== undefined) updateData.fullName = validatedData.fullName || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    // roleId puede venir del body si no está en el schema
    if (body.roleId !== undefined) updateData.roleId = body.roleId
    if (validatedData.isSuperAdmin !== undefined) updateData.isSuperAdmin = validatedData.isSuperAdmin
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    // Si se proporciona una nueva contraseña, hashearla
    if (validatedData.password && validatedData.password.trim() !== '') {
      updateData.password = await PasswordService.hashPassword(validatedData.password)
    }

    // Obtener usuario actual y usuario objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetUser = await UserAdminService.getUserById(id)

    const updatedUser = await UserAdminService.updateUser(id, updateData)

    // Registrar actualización de usuario en auditoría
    if (currentUser) {
      const changedFields: string[] = []
      if (validatedData.email !== undefined && targetUser?.email !== validatedData.email) {
        changedFields.push('email')
      }
      if (validatedData.role !== undefined && targetUser?.role !== validatedData.role) {
        changedFields.push('role')
      }
      if (validatedData.isSuperAdmin !== undefined && targetUser?.isSuperAdmin !== validatedData.isSuperAdmin) {
        changedFields.push('isSuperAdmin')
      }
      if (validatedData.isActive !== undefined && targetUser?.isActive !== validatedData.isActive) {
        changedFields.push('isActive')
      }
      if (validatedData.password && validatedData.password.trim() !== '') {
        changedFields.push('password')
      }

      // Registrar cambio de rol específicamente
      if (validatedData.role !== undefined && targetUser?.role !== validatedData.role) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            actionType: 'ROLE_CHANGED',
            entityType: 'User',
            entityId: id,
            details: {
              oldRole: targetUser?.role,
              newRole: validatedData.role,
              targetUserEmail: targetUser?.email,
            },
          },
          request
        )
      }

      // Registrar otros cambios
      if (changedFields.length > 0 && !changedFields.includes('role')) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            actionType: 'USER_UPDATED',
            entityType: 'User',
            entityId: id,
            details: {
              changedFields,
              targetUserEmail: targetUser?.email,
            },
          },
          request
        )
      }
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_ADMIN_USER', userId: id }))
  }
}

// PATCH - Activar o desactivar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }
    
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      throw AppError.validation('Se requiere un valor booleano para isActive')
    }

    // Obtener usuario actual y usuario objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetUser = await UserAdminService.getUserById(id)

    const updatedUser = await UserAdminService.toggleUserStatus(id, isActive)

    // Registrar activación/desactivación de usuario en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          actionType: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entityType: 'User',
          entityId: id,
          details: {
            targetUserEmail: targetUser?.email,
          },
        },
        request
      )
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'PATCH_ADMIN_USER', userId: id }))
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentAdminUser(request)

    // Verificar si el usuario existe
    const user = await UserAdminService.getUserById(id)
    
    if (!user) {
      throw AppError.notFound('Usuario no encontrado')
    }

    // Intentar eliminar el usuario
    await UserAdminService.deleteUser(id)

    // Registrar eliminación de usuario en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          actionType: 'USER_DELETED',
          entityType: 'User',
          entityId: id,
          details: {
            deletedUserEmail: user.email,
            deletedUserName: user.fullName,
          },
        },
        request
      )
    }

    return NextResponse.json(
      { message: 'Usuario eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_ADMIN_USER', userId: id }))
  }
}

