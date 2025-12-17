/**
 * API de Gestión de Sesiones - Sistema de Autenticación Empresarial
 * 
 * Permite obtener, gestionar y terminar sesiones activas del usuario
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug de organización no proporcionado' },
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

    // Obtener sesiones activas del usuario
    const sessions = await EnhancedTokenService.getUserActiveSessions(
      payload.userId,
      payload.organizationId
    )

    // Marcar la sesión actual
    const currentSessionId = payload.sessionId
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }))

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCurrent,
      total: sessions.length,
    })

  } catch (error) {
    logger.error('Error obteniendo sesiones activas', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug de organización no proporcionado' },
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

    // Obtener sessionId específica del query string o invalidar todas las demás
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("Session Id")

    let invalidatedCount = 0

    if (sessionId) {
      // Invalidar sesión específica (no puede ser la actual)
      if (sessionId === payload.sessionId) {
        return NextResponse.json(
          { error: 'No puedes terminar tu sesión actual desde aquí' },
          { status: 400 }
        )
      }

      await prisma.enhancedSession.update({
        where: { 
          id: sessionId,
          userId: payload.userId, // Asegurar que solo pueda invalidar sus propias sesiones
        },
        data: {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: 'USER_TERMINATED',
        }
      })
      invalidatedCount = 1
    } else {
      // Invalidar todas las demás sesiones (excepto la actual)
      invalidatedCount = await EnhancedTokenService.invalidateAllUserSessions(
        payload.userId,
        payload.organizationId,
        payload.sessionId // Excepto la sesión actual
      )
    }

    return NextResponse.json({
      success: true,
      message: sessionId 
        ? 'Sesión terminada correctamente'
        : `${invalidatedCount} sesiones terminadas correctamente`,
      invalidatedCount,
    })

  } catch (error) {
    logger.error('Error terminando sesiones', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}