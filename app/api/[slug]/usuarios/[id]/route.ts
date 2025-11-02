import { NextRequest, NextResponse } from 'next/server'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const usuario = await UsuarioSasService.getUsuarioById(id)
    
    if (!usuario) {
      throw AppError.notFound('Usuario no encontrado')
    }

    // No retornar la contraseña
    const { contraseña, ...usuarioSinPassword } = usuario
    return NextResponse.json(usuarioSinPassword)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_SAS_USER', userId: id }))
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }
    
    const { slug } = await params
    const { ci, nombre, apellido, direccion, telefono, correo, contraseña, rolId, foto, sucursalId, isActive } = body

    // Obtener usuario actual y usuario objetivo para auditoría
    const currentUser = await getCurrentSasUser(request, slug)
    const targetUser = await UsuarioSasService.getUsuarioById(id)

    const usuario = await UsuarioSasService.updateUsuario(id, {
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      correo,
      contraseña,
      rolId,
      foto,
      sucursalId,
      isActive
    })

    // Registrar actualización de usuario en auditoría
    if (currentUser && targetUser) {
      const changedFields: string[] = []
      if (rolId !== undefined && targetUser.rolId !== rolId) {
        changedFields.push('rolId')
      }
      if (isActive !== undefined && targetUser.isActive !== isActive) {
        changedFields.push('isActive')
      }
      if (contraseña !== undefined && contraseña.trim() !== '') {
        changedFields.push('password')
      }

      // Registrar cambio de rol específicamente
      if (rolId !== undefined && targetUser.rolId !== rolId) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            customerId: targetUser.customerId,
            actionType: 'ROLE_CHANGED',
            entityType: 'UsuarioSas',
            entityId: id,
            details: {
              oldRolId: targetUser.rolId,
              newRolId: rolId,
              targetUserCi: targetUser.ci,
              targetUserEmail: targetUser.correo,
            },
          },
          request
        )
      }

      // Registrar otros cambios
      if (changedFields.length > 0 && !changedFields.includes('rolId')) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            customerId: targetUser.customerId,
            actionType: 'USER_UPDATED',
            entityType: 'UsuarioSas',
            entityId: id,
            details: {
              changedFields,
              targetUserCi: targetUser.ci,
              targetUserEmail: targetUser.correo,
            },
          },
          request
        )
      }

      // Registrar activación/desactivación
      if (isActive !== undefined && targetUser.isActive !== isActive) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            customerId: targetUser.customerId,
            actionType: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            entityType: 'UsuarioSas',
            entityId: id,
            details: {
              targetUserCi: targetUser.ci,
              targetUserEmail: targetUser.correo,
            },
          },
          request
        )
      }
    }

    // No retornar la contraseña
    const { contraseña: _, ...usuarioSinPassword } = usuario
    return NextResponse.json(usuarioSinPassword)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_SAS_USER', userId: id }))
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    // Obtener usuario actual y usuario objetivo para auditoría
    const currentUser = await getCurrentSasUser(request, slug)
    const targetUser = await UsuarioSasService.getUsuarioById(id)

    await UsuarioSasService.deleteUsuario(id)

    // Registrar eliminación de usuario en auditoría
    if (currentUser && targetUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          customerId: targetUser.customerId,
          actionType: 'USER_DELETED',
          entityType: 'UsuarioSas',
          entityId: id,
          details: {
            deletedUserCi: targetUser.ci,
            deletedUserEmail: targetUser.correo,
            deletedUserName: `${targetUser.nombre} ${targetUser.apellido}`,
          },
        },
        request
      )
    }

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_SAS_USER', userId: id }))
  }
}

