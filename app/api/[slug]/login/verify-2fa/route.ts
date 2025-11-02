/**
 * POST /api/[slug]/login/verify-2fa
 * 
 * Verifica el código 2FA durante el login SAS y retorna el token JWT final
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { SasJWTService } from '@/lib/auth/sas-jwt'
import { SessionManagement } from '@/lib/auth/session-management'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { verifyTwoFactorSchema } from '@/lib/validators/two-factor-validators'
import { logger } from '@/lib/utils/logger'
import jwt from 'jsonwebtoken'

const SAS_JWT_SECRET = process.env.SAS_JWT_SECRET || 'dev-sas-secret'

interface TempTokenPayload {
  userId: string
  customerId: string
  temp: true
  exp: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Validar body
    const validation = await validateRequestBody(verifyTwoFactorSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { code, tempToken } = validation.data

    // Verificar y decodificar token temporal
    let tempPayload: TempTokenPayload
    try {
      tempPayload = jwt.verify(tempToken, SAS_JWT_SECRET) as TempTokenPayload
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
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id: tempPayload.userId },
      include: {
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        sucursal: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            razonSocial: true,
            slug: true,
          },
        },
      },
    })

    if (!usuario || !usuario.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el usuario pertenece al cliente correcto
    if (usuario.customer.slug !== slug) {
      return NextResponse.json(
        { error: 'Token inválido para este cliente' },
        { status: 403 }
      )
    }

    // Verificar que tiene 2FA habilitado
    if (!usuario.twoFactorEnabled || !usuario.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA no está habilitado para este usuario' },
        { status: 400 }
      )
    }

    // Desencriptar secret
    const secret = TwoFactorService.decryptSecret(usuario.twoFactorSecret)

    // Obtener backup codes
    const backupCodes = usuario.twoFactorBackupCodes as string[] | null

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
          userId: usuario.id,
          customerId: usuario.customerId,
          actionType: 'TWO_FACTOR_VERIFY_FAILED',
          details: {
            identifier: usuario.ci || usuario.correo,
            reason: 'Código 2FA inválido durante login',
            slug,
          },
        },
        request
      )

      logger.security('Código 2FA inválido durante login SAS', {
        userId: usuario.id,
        customerId: usuario.customerId,
        slug,
      })

      return NextResponse.json(
        { error: 'Código inválido. Verifica el código en tu app authenticator.' },
        { status: 401 }
      )
    }

    // Código válido: Proceder con login completo
    // Si usó backup code, registrar
    if (verification.isBackupCode && backupCodes) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: usuario.id,
          customerId: usuario.customerId,
          actionType: 'TWO_FACTOR_BACKUP_CODE_USED',
          details: {
            identifier: usuario.ci || usuario.correo,
            note: 'Se usó un código de respaldo durante login',
            slug,
          },
        },
        request
      )

      logger.security('Backup code usado durante login SAS', {
        userId: usuario.id,
        customerId: usuario.customerId,
        slug,
      })
    }

    // Crear sesión en BD
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    const deviceInfo = SessionManagement.getDeviceInfo(request)

    const sessionToken = await SessionManagement.createSession({
      userId: usuario.id,
      customerId: usuario.customerId,
      systemType: 'sas',
      ipAddress,
      userAgent,
      deviceInfo,
    }, {
      forceSingleSession: false,
      trackDevice: true,
    })

    // Generar token JWT final
    const finalToken = await SasJWTService.generateToken({
      userId: usuario.id,
      correo: usuario.correo || undefined,
      customerId: usuario.customerId,
      sessionId: sessionToken,
    })

    // Preparar datos del usuario
    const userData = {
      id: usuario.id,
      ci: usuario.ci,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      foto: usuario.foto,
      rol: usuario.rol,
      sucursal: usuario.sucursal,
      customer: usuario.customer,
    }

    // Registrar login exitoso
    await SecurityAuditLogger.logLoginAttempt(
      {
        userId: usuario.id,
        customerId: usuario.customerId,
        method: usuario.ci ? 'CI' : 'email',
        identifier: usuario.ci || usuario.correo || '',
        success: true,
      },
      request
    )

    logger.info('Login con 2FA exitoso SAS', {
      userId: usuario.id,
      customerId: usuario.customerId,
      slug,
    })

    // Preparar respuesta
    const response = NextResponse.json({
      success: true,
      user: userData,
      redirect: `/${slug}/dashboard`,
    }, { status: 200 })

    // Establecer cookies
    const sessionData = {
      userId: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      fullName: `${usuario.nombre} ${usuario.apellido}`,
      correo: usuario.correo,
      rol: usuario.rol?.nombre || null,
      customerSlug: slug,
      customerId: usuario.customerId,
      sucursalId: usuario.sucursal?.id || null,
    }

    response.cookies.set('sas-session', JSON.stringify(sessionData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    response.cookies.set('sas-auth-token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Error verificando 2FA en login SAS', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

