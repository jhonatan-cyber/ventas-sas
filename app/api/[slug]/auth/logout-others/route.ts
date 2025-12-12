/**
 * API para Cerrar Todas las Demás Sesiones - Sistema de Autenticación Empresarial
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { logger } from '@/lib/utils/logger'

export async function POST(
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
    const accessToken = request.cookies.get('sas-auth-token')?.value
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

    // Invalidar todas las demás sesiones (excepto la actual)
    const invalidatedCount = await EnhancedTokenService.invalidateAllUserSessions(
      payload.userId,
      payload.organizationId,
      payload.sessionId // Excepto la sesión actual
    )

    return NextResponse.json({
      success: true,
      message: `${invalidatedCount} sesiones cerradas correctamente`,
      invalidatedCount,
    })

  } catch (error) {
    logger.error('Error cerrando otras sesiones', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}