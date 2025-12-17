import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { getOrganizationBySlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("Token")

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token no proporcionado' },
        { status: 400 }
      )
    }

    // Obtener la organización
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return NextResponse.json(
        { valid: false, error: 'Organización no encontrada' },
        { status: 404 }
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
          },
        },
      },
    })

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Token no válido',
      })
    }

    // Verificar que el token pertenezca a la organización correcta
    if (resetToken.organizationId !== organization.id) {
      return NextResponse.json({
        valid: false,
        error: 'Token no válido para esta organización',
      })
    }

    // Verificar que el token no haya sido usado
    if (resetToken.usedAt) {
      return NextResponse.json({
        valid: false,
        error: 'Este enlace ya ha sido utilizado',
      })
    }

    // Verificar que el token no haya expirado
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'El enlace de recuperación ha expirado',
      })
    }

    // Verificar que el usuario esté activo
    if (!resetToken.user || !resetToken.user.isActive || resetToken.user.deletedAt) {
      return NextResponse.json({
        valid: false,
        error: 'Usuario no activo',
      })
    }

    return NextResponse.json({
      valid: true,
    })
  } catch (error) {
    logger.error('Error al validar token de recuperación', error as Error)
    return NextResponse.json(
      { valid: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

