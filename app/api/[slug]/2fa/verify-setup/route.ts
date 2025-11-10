/**
 * POST /api/[slug]/2fa/verify-setup
 * 
 * Verifica el código TOTP durante setup y habilita 2FA para usuario SAS
 */

import { NextRequest, NextResponse } from 'next/server'

import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { logger } from '@/lib/utils/logger'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { verifySetupSchema } from '@/lib/validators/two-factor-validators'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar autenticación
    const user = await getCurrentSasUser(request, slug)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Validar body
    const validation = await validateRequestBody(verifySetupSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { code } = validation.data

    // Obtener usuario
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        organizationId: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene secret
    if (!usuario.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Debes iniciar el setup de 2FA primero' },
        { status: 400 }
      )
    }

    // Si ya está habilitado
    if (usuario.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA ya está habilitado' },
        { status: 400 }
      )
    }

    // Desencriptar secret
    const secret = TwoFactorService.decryptSecret(usuario.twoFactorSecret)

    // Verificar código
    const isValid = TwoFactorService.verifyToken(secret, code)

    if (!isValid) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: usuario.id,
          organizationId: usuario.organizationId,
          actionType: 'TWO_FACTOR_VERIFY_FAILED',
          details: {
            identifier: usuario.email || '',
            reason: 'Código inválido durante setup',
            slug,
          },
        },
        request
      )

      logger.security('Código 2FA inválido durante setup SAS', {
        userId: usuario.id,
        organizationId: usuario.organizationId,
        slug,
      })

      return NextResponse.json(
        { error: 'Código inválido. Por favor, verifica el código en tu app authenticator.' },
        { status: 400 }
      )
    }

    // Habilitar 2FA
    await prisma.usuarioSas.update({
      where: { id: usuario.id },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
      },
    })

    // Registrar evento
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: usuario.id,
        organizationId: usuario.organizationId,
        actionType: 'TWO_FACTOR_ENABLED',
        details: {
          identifier: usuario.email || '',
          slug,
        },
      },
      request
    )

    logger.security('2FA habilitado exitosamente SAS', {
      userId: usuario.id,
      organizationId: usuario.organizationId,
      slug,
    })

    return NextResponse.json({
      success: true,
      message: '2FA habilitado exitosamente. Tu cuenta ahora está más segura.',
    })
  } catch (error) {
    logger.error('Error verificando setup 2FA SAS', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

