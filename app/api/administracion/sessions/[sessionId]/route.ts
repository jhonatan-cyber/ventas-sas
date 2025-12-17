/**
 * API para Terminar Sesión Específica desde Administración
 */

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const { sessionId } = resolvedParams

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de sesión requerido' },
        { status: 400 }
      )
    }

    // Verificar autenticación de administrador
    const adminToken = request.cookies.get("admin-auth-token")?.value
    if (!adminToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // TODO: Verificar que el token de admin sea válido y tenga permisos
    // Por ahora, asumimos que si tiene la cookie, está autenticado

    // Verificar que la sesión existe
    const session = await prisma.enhancedSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'La sesión ya está terminada' },
        { status: 400 }
      )
    }

    // Terminar la sesión
    await prisma.enhancedSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        invalidatedAt: new Date(),
        invalidationReason: 'ADMIN_TERMINATED',
      }
    })

    // Log de auditoría
    logger.info('Sesión terminada por administrador', {
      sessionId,
      userId: session.userId,
      userName: `${session.user.nombre} ${session.user.apellido}`,
      userEmail: session.user.email,
      terminatedBy: 'admin', // TODO: obtener ID del admin que terminó la sesión
    })

    return NextResponse.json({
      success: true,
      message: 'Sesión terminada correctamente',
    })

  } catch (error) {
    logger.error('Error terminando sesión desde administración', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}