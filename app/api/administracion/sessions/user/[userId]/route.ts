/**
 * API para Terminar Todas las Sesiones de un Usuario desde Administración
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId } = resolvedParams

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Verificar autenticación de administrador
    const adminToken = request.cookies.get('admin-auth-token')?.value
    if (!adminToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // TODO: Verificar que el token de admin sea válido y tenga permisos
    // Por ahora, asumimos que si tiene la cookie, está autenticado

    // Verificar que el usuario existe
    const user = await prisma.usuarioSas.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        organizationId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Contar sesiones activas antes de terminarlas
    const activeSessionsCount = await prisma.enhancedSession.count({
      where: {
        userId,
        isActive: true,
      }
    })

    if (activeSessionsCount === 0) {
      return NextResponse.json(
        { error: 'El usuario no tiene sesiones activas' },
        { status: 400 }
      )
    }

    // Terminar todas las sesiones del usuario
    const invalidatedCount = await EnhancedTokenService.invalidateAllUserSessions(
      userId,
      user.organizationId
      // No excluir ninguna sesión - terminar todas
    )

    // Log de auditoría
    logger.info('Todas las sesiones de usuario terminadas por administrador', {
      userId,
      userName: `${user.nombre} ${user.apellido}`,
      userEmail: user.email,
      invalidatedCount,
      terminatedBy: 'admin', // TODO: obtener ID del admin que terminó las sesiones
    })

    return NextResponse.json({
      success: true,
      message: `${invalidatedCount} sesiones terminadas correctamente`,
      invalidatedCount,
    })

  } catch (error) {
    logger.error('Error terminando sesiones de usuario desde administración', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}