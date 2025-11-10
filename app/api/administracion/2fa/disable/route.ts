/**
 * POST /api/administracion/2fa/disable
 * 
 * Deshabilita 2FA para el usuario autenticado (requiere contraseña)
 */

import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { logger } from '@/lib/utils/logger'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { disableTwoFactorSchema } from '@/lib/validators/two-factor-validators'

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
    const validation = await validateRequestBody(disableTwoFactorSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { password } = validation.data

    // Obtener usuario con contraseña
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene 2FA habilitado
    if (!profile.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA no está habilitado' },
        { status: 400 }
      )
    }

    // Verificar contraseña
    if (!profile.password) {
      return NextResponse.json(
        { error: 'No se puede verificar la contraseña' },
        { status: 400 }
      )
    }

    const isValidPassword = await PasswordService.verifyPassword(
      password,
      profile.password
    )

    if (!isValidPassword) {
      // Registrar intento fallido
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: profile.id,
          actionType: 'TWO_FACTOR_DISABLE_FAILED',
          details: {
            email: profile.email,
            reason: 'Contraseña incorrecta',
          },
        },
        request
      )

      logger.security('Intento de deshabilitar 2FA con contraseña incorrecta', {
        userId: profile.id,
        email: profile.email,
      })

      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    // Contraseña válida: Deshabilitar 2FA
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: Prisma.JsonNull,
        twoFactorEnabledAt: null,
      },
    })

    // Registrar evento de seguridad
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: profile.id,
        actionType: 'TWO_FACTOR_DISABLED',
        details: {
          email: profile.email,
        },
      },
      request
    )

    logger.security('2FA deshabilitado', {
      userId: profile.id,
      email: profile.email,
    })

    return NextResponse.json({
      success: true,
      message: '2FA deshabilitado exitosamente.',
    })
  } catch (error) {
    logger.error('Error deshabilitando 2FA', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

