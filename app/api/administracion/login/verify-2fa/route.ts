/**
 * POST /api/administracion/login/verify-2fa
 * 
 * Verifica el código 2FA durante el login y retorna el token JWT final
 */

import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { SessionManagement } from '@/lib/auth/session-management'
import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { verifyTwoFactorSchema } from '@/lib/validators/two-factor-validators'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret'

interface TempTokenPayload {
  userId: string
  email: string
  isSuperAdmin: boolean
  temp: true
  exp: number
}

export async function POST(request: NextRequest) {
  try {
    // Validar body
    const validation = await validateRequestBody(verifyTwoFactorSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { code, tempToken } = validation.data

    // Verificar y decodificar token temporal
    let tempPayload: TempTokenPayload
    try {
      tempPayload = jwt.verify(tempToken, ADMIN_JWT_SECRET) as TempTokenPayload
    } catch {
      return NextResponse.json(
        { error: 'Token temporal inválido o expirado' },
        { status: 401 }
      )
    }

    // Verificar que es un token temporal
    if (!tempPayload.temp || !tempPayload.userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener usuario
    const profile = await prisma.profile.findUnique({
      where: { id: tempPayload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isSuperAdmin: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        isActive: true,
      },
    })

    if (!profile || !profile.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que tiene 2FA habilitado
    if (!profile.twoFactorEnabled || !profile.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA no está habilitado para este usuario' },
        { status: 400 }
      )
    }

    // Desencriptar secret
    const secret = TwoFactorService.decryptSecret(profile.twoFactorSecret)

    // Obtener backup codes
    const backupCodes = profile.twoFactorBackupCodes as string[] | null

    // Verificar código 2FA
    const verification = await TwoFactorService.verifyTwoFactor(
      secret,
      code,
      backupCodes || undefined
    )

    if (!verification.valid) {
      // Registrar intento fallido
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: profile.id,
          actionType: 'TWO_FACTOR_VERIFY_FAILED',
          details: {
            email: profile.email,
            reason: 'Código 2FA inválido durante login',
          },
        },
        request
      )

      logger.security('Código 2FA inválido durante login', {
        userId: profile.id,
        email: profile.email,
      })

      return NextResponse.json(
        { error: 'Código inválido. Verifica el código en tu app authenticator.' },
        { status: 401 }
      )
    }

    // Código válido: Proceder con login completo
    await prisma.profile.update({
      where: { id: profile.id },
      data: { lastLoginAt: new Date() },
    })

    // Si usó backup code, registrar y opcionalmente invalidarlo
    if (verification.isBackupCode && backupCodes) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: profile.id,
          actionType: 'TWO_FACTOR_BACKUP_CODE_USED',
          details: {
            email: profile.email,
            note: 'Se usó un código de respaldo durante login',
          },
        },
        request
      )

      logger.security('Backup code usado durante login', {
        userId: profile.id,
        email: profile.email,
      })

      // Opcional: Invalidar el backup code usado
      // Por ahora lo dejamos para que puedan usarlo si es necesario
    }

    // Crear sesión en BD
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    const deviceInfo = SessionManagement.getDeviceInfo(request)

    const sessionToken = await SessionManagement.createSession({
      userId: profile.id,
      systemType: 'admin',
      ipAddress,
      userAgent,
      deviceInfo,
    }, {
      forceSingleSession: false,
      trackDevice: true,
    })

    // Generar token JWT final
    const finalToken = await AdminJWTService.generateToken({
      userId: profile.id,
      email: profile.email,
      isSuperAdmin: profile.isSuperAdmin,
      sessionId: sessionToken,
    })

    // Registrar login exitoso
    await SecurityAuditLogger.logLoginAttempt(
      {
        userId: profile.id,
        method: 'email',
        identifier: profile.email,
        success: true,
      },
      request
    )

    logger.info('Login con 2FA exitoso', {
      userId: profile.id,
      email: profile.email,
    })

    // Preparar respuesta
    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        isSuperAdmin: profile.isSuperAdmin,
      },
      redirect: '/administracion/dashboard',
    }, { status: 200 })

    // Establecer cookie con token final
    response.cookies.set('admin-auth-token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Error verificando 2FA en login', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

