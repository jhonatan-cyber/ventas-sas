/**
 * API para Terminar Sesión Específica - Sistema de Autenticación Empresarial
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const { slug, sessionId } = resolvedParams

    if (!slug || !sessionId) {
      return NextResponse.json(
        { error: 'Parámetros faltantes' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const accessToken = request.cookies.get("sas-auth-token")?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const payload = await EnhancedTokenService.verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // No permitir terminar la sesión actual
    if (sessionId === payload.sessionId) {
      return NextResponse.json(
        { error: 'No puedes terminar tu sesión actual desde aquí' },
        { status: 400 }
      )
    }

    // Verificar que la sesión pertenece al usuario actual
    const session = await prisma.enhancedSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        isActive: true,
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para terminar esta sesión' },
        { status: 403 }
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
        invalidationReason: 'USER_TERMINATED',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Sesión terminada correctamente',
    })

  } catch (error) {
    logger.error('Error terminando sesión específica', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}