import { NextRequest, NextResponse } from 'next/server'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { getOrganizationBySlug } from '@/lib/utils/organization'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug de organización no proporcionado' },
        { status: 400 }
      )
    }

    // Obtener la organización
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada o inactiva' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar el token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            deletedAt: true,
            email: true,
          },
        },
      },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token no válido' },
        { status: 400 }
      )
    }

    // Verificar que el token pertenezca a la organización correcta
    if (resetToken.organizationId !== organization.id) {
      return NextResponse.json(
        { error: 'Token no válido para esta organización' },
        { status: 400 }
      )
    }

    // Verificar que el token no haya sido usado
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Este enlace ya ha sido utilizado' },
        { status: 400 }
      )
    }

    // Verificar que el token no haya expirado
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de recuperación ha expirado' },
        { status: 400 }
      )
    }

    // Verificar que el usuario esté activo
    if (!resetToken.user.isActive || resetToken.user.deletedAt) {
      return NextResponse.json(
        { error: 'Usuario no activo' },
        { status: 400 }
      )
    }

    // Hashear la nueva contraseña
    const hashedPassword = await PasswordService.hashPassword(password)

    // Actualizar la contraseña del usuario
    await prisma.usuarioSas.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    // Marcar el token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    })

    // Invalidar todas las sesiones activas del usuario por seguridad
    await prisma.sasSession.updateMany({
      where: {
        userId: resetToken.userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    logger.info('Contraseña restablecida exitosamente', {
      userId: resetToken.userId,
      slug,
    })

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
    })
  } catch (error) {
    logger.error('Error al restablecer contraseña', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

