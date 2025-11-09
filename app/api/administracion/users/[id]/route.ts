import { NextRequest, NextResponse } from 'next/server'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { PasswordService } from '@/lib/auth/password'
import { updateUserSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para ver detalles de usuarios
    const canView = await PermissionCheckService.hasActivePermission(currentUser.id, 'usuarios_ver_detalles')
    if (!canView) {
      return NextResponse.json({ error: 'No tiene permiso para ver detalles de usuarios' }, { status: 403 })
    }

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

    // Obtener usuario actual para verificar permisos
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      throw AppError.unauthorized('No autorizado')
    }

    // Verificar permiso de editar usuarios
    const hasPermission = await PermissionCheckService.hasActivePermission(
      currentUser.id,
      'usuarios_editar'
    )
    if (!hasPermission) {
      throw AppError.forbidden('No tienes permiso para editar usuarios')
    }

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

    // Obtener usuario objetivo ANTES de procesar actualizaciones
    // (necesitamos el CI antiguo para comparar)
    const targetUser = await UserAdminService.getUserById(id)

    if (!targetUser) {
      throw AppError.notFound('Usuario no encontrado')
    }

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
    if (validatedData.photo !== undefined) updateData.photo = validatedData.photo || null

    // Verificar si el CI cambió
    const oldCi = targetUser.ci
    const newCi = validatedData.ci !== undefined ? (validatedData.ci || null) : undefined
    const ciChanged = newCi !== undefined && oldCi !== newCi

    // Si el CI cambió, SIEMPRE actualizar la contraseña automáticamente al nuevo CI
    // Esto es por seguridad: si cambia el identificador único, debe cambiar la contraseña
    // Pasamos la contraseña en texto plano, el servicio se encargará del hashing
    if (ciChanged) {
      if (newCi) {
        // Si el nuevo CI tiene valor, usar el nuevo CI como contraseña
        updateData.password = newCi
      } else if (oldCi) {
        // Si el CI se eliminó (cambió de un valor a null), generar una contraseña temporal aleatoria
        // Esto previene que el usuario quede sin contraseña válida
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
        updateData.password = tempPassword
      }
    } else if (validatedData.password && validatedData.password.trim() !== '') {
      // Si el CI no cambió pero se proporciona una contraseña explícita, usarla
      updateData.password = validatedData.password
    }
    // Si el CI no cambió y no se proporciona contraseña, no se actualiza la contraseña

    const updatedUser = await UserAdminService.updateUser(id, updateData)

      // Registrar actualización de usuario en auditoría
    if (currentUser) {
      const changedFields: string[] = []
      if (validatedData.email !== undefined && targetUser?.email !== validatedData.email) {
        changedFields.push('email')
      }
      if (validatedData.ci !== undefined && oldCi !== newCi) {
        changedFields.push('ci')
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
      // Registrar cambio de contraseña si cambió el CI o se proporcionó explícitamente
      if (ciChanged || (validatedData.password && validatedData.password.trim() !== '')) {
        changedFields.push('password')
        // Si cambió por CI, registrar en auditoría
        if (ciChanged) {
          await SecurityAuditLogger.logSensitiveAction(
            {
              userId: currentUser.id,
              actionType: 'PASSWORD_AUTO_UPDATED_BY_CI',
              entityType: 'User',
              entityId: id,
              details: {
                reason: 'CI actualizado',
                oldCi,
                newCi,
                targetUserEmail: targetUser?.email,
              },
            },
            request
          )
        }
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
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

    // Verificar permiso según la acción (activar o desactivar)
    const requiredPermission = isActive ? 'usuarios_activar' : 'usuarios_desactivar'
    const canToggle = await PermissionCheckService.hasActivePermission(currentUser.id, requiredPermission)
    if (!canToggle) {
      return NextResponse.json({ 
        error: `No tiene permiso para ${isActive ? 'activar' : 'desactivar'} usuarios` 
      }, { status: 403 })
    }

    // Obtener usuario objetivo para auditoría
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
    
    // Obtener usuario actual para verificar permisos
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      throw AppError.unauthorized('No autorizado')
    }

    // Verificar permiso de eliminar usuarios
    const hasPermission = await PermissionCheckService.hasActivePermission(
      currentUser.id,
      'usuarios_eliminar'
    )
    if (!hasPermission) {
      throw AppError.forbidden('No tienes permiso para eliminar usuarios')
    }

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

