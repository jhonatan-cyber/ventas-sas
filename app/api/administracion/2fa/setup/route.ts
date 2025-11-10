/**
 * POST /api/administracion/2fa/setup
 * 
 * Inicia el proceso de configuración de 2FA para el usuario autenticado
 * Retorna el QR code y los backup codes iniciales
 */

import { NextRequest, NextResponse } from 'next/server'

import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { logger } from '@/lib/utils/logger'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

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

    // Verificar que el usuario existe y está activo
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        twoFactorEnabled: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Si ya tiene 2FA habilitado, no permitir setup de nuevo sin deshabilitarlo primero
    if (profile.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA ya está habilitado. Deshabilítalo primero si deseas reconfigurarlo.' },
        { status: 400 }
      )
    }

    // Generar setup de 2FA
    const setup = await TwoFactorService.setupTwoFactor(
      profile.email,
      'Sistema de Administración SAS'
    )

    // Encriptar secret antes de almacenar (no guardar todavía, solo después de verificar)
    const encryptedSecret = TwoFactorService.encryptSecret(setup.secret)

    // Hashear backup codes
    const hashedBackupCodes = await TwoFactorService.hashBackupCodes(setup.backupCodes)

    // Almacenar secret y backup codes temporalmente (sin habilitar aún)
    // Se habilitará después de verificar el código
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        // No habilitar todavía, esperar verificación
      },
    })

    // Registrar evento de seguridad
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: profile.id,
        actionType: 'TWO_FACTOR_SETUP_INITIATED',
        details: {
          email: profile.email,
        },
      },
      request
    )

    logger.security('Inicio de configuración 2FA', {
      userId: profile.id,
      email: profile.email,
    })

    // Retornar QR code y backup codes
    // IMPORTANTE: Los backup codes solo se muestran una vez
    return NextResponse.json({
      success: true,
      qrCode: setup.qrCode,
      secret: TwoFactorService.formatSecret(setup.secret), // Formateado para mostrar manualmente si es necesario
      backupCodes: setup.backupCodes, // Mostrar al usuario, guardar de forma segura
      message: 'Escanea el QR code con tu app authenticator y luego verifica con un código',
    })
  } catch (error) {
    logger.error('Error en setup 2FA', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

