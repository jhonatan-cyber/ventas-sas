/**
 * POST /api/[slug]/2fa/disable
 * 
 * Deshabilita 2FA para usuario SAS (requiere contraseña)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PasswordService } from '@/lib/auth/password'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { disableTwoFactorSchema } from '@/lib/validators/two-factor-validators'
import { logger } from '@/lib/utils/logger'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

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
    const validation = await validateRequestBody(disableTwoFactorSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { password } = validation.data

    // Obtener usuario
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        correo: true,
        contraseña: true,
        twoFactorEnabled: true,
        customerId: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene 2FA habilitado
    if (!usuario.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA no está habilitado' },
        { status: 400 }
      )
    }

    // Verificar contraseña
    if (!usuario.password) {
      return NextResponse.json(
        { error: 'No se puede verificar la contraseña' },
        { status: 400 }
      )
    }

    const isValidPassword = await PasswordService.verifyPassword(
      password,
      usuario.password
    )

    if (!isValidPassword) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: usuario.id,
          customerId: usuario.customerId,
          actionType: 'TWO_FACTOR_DISABLE_FAILED',
          details: {
            identifier: usuario.email || '',
            reason: 'Contraseña incorrecta',
            slug,
          },
        },
        request
      )

      logger.security('Intento de deshabilitar 2FA con contraseña incorrecta SAS', {
        userId: usuario.id,
        customerId: usuario.customerId,
        slug,
      })

      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    // Deshabilitar 2FA
    await prisma.usuarioSas.update({
      where: { id: usuario.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorEnabledAt: null,
      },
    })

    // Registrar evento
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: usuario.id,
        customerId: usuario.customerId,
        actionType: 'TWO_FACTOR_DISABLED',
        details: {
          identifier: usuario.email || '',
          slug,
        },
      },
      request
    )

    logger.security('2FA deshabilitado SAS', {
      userId: usuario.id,
      customerId: usuario.customerId,
      slug,
    })

    return NextResponse.json({
      success: true,
      message: '2FA deshabilitado exitosamente.',
    })
  } catch (error) {
    logger.error('Error deshabilitando 2FA SAS', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

