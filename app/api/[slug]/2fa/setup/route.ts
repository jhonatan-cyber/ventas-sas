/**
 * POST /api/[slug]/2fa/setup
 * 
 * Inicia el proceso de configuración de 2FA para usuario SAS autenticado
 */

import { NextRequest, NextResponse } from 'next/server'

import { TwoFactorService } from '@/lib/auth/two-factor-service'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { logger } from '@/lib/utils/logger'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

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

    // Verificar que el usuario existe
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
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

    // Si ya tiene 2FA habilitado
    if (usuario.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA ya está habilitado. Deshabilítalo primero si deseas reconfigurarlo.' },
        { status: 400 }
      )
    }

    // Generar setup de 2FA
    const email = usuario.email || `${usuario.nombre}.${usuario.apellido}@${slug}.local`
    const setup = await TwoFactorService.setupTwoFactor(
      email,
      `Sistema SAS - ${slug}`
    )

    // Encriptar secret
    const encryptedSecret = TwoFactorService.encryptSecret(setup.secret)

    // Hashear backup codes
    const hashedBackupCodes = await TwoFactorService.hashBackupCodes(setup.backupCodes)

    // Almacenar secret y backup codes (sin habilitar aún)
    await prisma.usuarioSas.update({
      where: { id: usuario.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    // Registrar evento
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: usuario.id,
        organizationId: usuario.organizationId,
        actionType: 'TWO_FACTOR_SETUP_INITIATED',
        details: {
          identifier: usuario.email || usuario.nombre,
          slug,
        },
      },
      request
    )

    logger.security('Inicio de configuración 2FA SAS', {
      userId: usuario.id,
      organizationId: usuario.organizationId,
      slug,
    })

    return NextResponse.json({
      success: true,
      qrCode: setup.qrCode,
      secret: TwoFactorService.formatSecret(setup.secret),
      backupCodes: setup.backupCodes,
      message: 'Escanea el QR code con tu app authenticator y luego verifica con un código',
    })
  } catch (error) {
    logger.error('Error en setup 2FA SAS', error as Error)
    return handleApiError(error, createErrorContext(request))
  }
}

