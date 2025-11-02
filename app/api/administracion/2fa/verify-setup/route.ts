/**
 * POST /api/administracion/2fa/verify-setup
 * 
 * Verifica el código TOTP ingresado durante el setup y habilita 2FA
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { verifySetupSchema } from '@/lib/validators/two-factor-validators'
import { logger } from '@/lib/utils/logger'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentAdminUser(request)
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

    // Obtener usuario con secret
    const profile = await prisma.profile.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene secret (setup iniciado)
    if (!profile.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Debes iniciar el setup de 2FA primero' },
        { status: 400 }
      )
    }

    // Si ya está habilitado, no permitir verificar de nuevo
    if (profile.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA ya está habilitado' },
        { status: 400 }
      )
    }

    // Desencriptar secret
    const secret = TwoFactorService.decryptSecret(profile.twoFactorSecret)

    // Verificar código TOTP
    const isValid = TwoFactorService.verifyToken(secret, code)

    if (!isValid) {
      // Registrar intento fallido
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: profile.id,
          actionType: 'TWO_FACTOR_VERIFY_FAILED',
          details: {
            email: profile.email,
            reason: 'Código inválido durante setup',
          },
        },
        request
      )

      logger.security('Código 2FA inválido durante setup', {
        userId: profile.id,
        email: profile.email,
      })

      return NextResponse.json(
        { error: 'Código inválido. Por favor, verifica el código en tu app authenticator.' },
        { status: 400 }
      )
    }

    // Código válido: Habilitar 2FA
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
      },
    })

    // Registrar evento de seguridad
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: profile.id,
        actionType: 'TWO_FACTOR_ENABLED',
        details: {
          email: profile.email,
        },
      },
      request
    )

    logger.security('2FA habilitado exitosamente', {
      userId: profile.id,
      email: profile.email,
    })

    return NextResponse.json({
      success: true,
      message: '2FA habilitado exitosamente. Tu cuenta ahora está más segura.',
    })
  } catch (error) {
    logger.error('Error verificando setup 2FA', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

