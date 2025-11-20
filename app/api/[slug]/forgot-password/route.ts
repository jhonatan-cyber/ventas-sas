import { randomBytes } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/admin/email-service'
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
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Correo electrónico es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Correo electrónico inválido' },
        { status: 400 }
      )
    }

    // Buscar primero en Customer (como en el módulo de facturación)
    // El email siempre debe venir de la tabla Customer ya que el cliente puede modificarlo
    const customerOrganization = await prisma.customerOrganization.findFirst({
      where: {
        organizationId: organization.id,
        isActive: true,
        customer: {
          email: email,
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            ci: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    })

    let usuario: any = null
    let usuarioEmail: string | null = null
    let usuarioNombre: string = 'Usuario'

    // Buscar primero en UsuarioSas (el sistema SAS solo permite login con UsuarioSas)
    let usuarioSas = await prisma.usuarioSas.findFirst({
      where: {
        organizationId: organization.id,
        email: email,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        ci: true,
        nombre: true,
        apellido: true,
      },
    })

    // Si no se encuentra en UsuarioSas, buscar en Customer y luego buscar UsuarioSas por CI
    if (!usuarioSas && customerOrganization?.customer) {
      const customer = customerOrganization.customer
      
      // Si el Customer tiene CI, buscar UsuarioSas por CI
      if (customer.ci) {
        usuarioSas = await prisma.usuarioSas.findFirst({
          where: {
            organizationId: organization.id,
            ci: customer.ci,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            email: true,
            ci: true,
            nombre: true,
            apellido: true,
          },
        })
      }
    }

    if (usuarioSas && usuarioSas.email) {
      usuario = {
        ...usuarioSas,
        tipo: 'usuarioSas',
      }
      usuarioEmail = usuarioSas.email
      usuarioNombre = `${usuarioSas.nombre || ''} ${usuarioSas.apellido || ''}`.trim() || 'Usuario'
    }

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    // para evitar enumeración de usuarios
    if (!usuario || !usuarioEmail) {
      logger.info('Intento de recuperación de contraseña para usuario no encontrado', {
        slug,
        identifier: email,
      })
      return NextResponse.json({
        success: true,
        message: 'Si el correo existe, se ha enviado un enlace de recuperación',
      })
    }

    // Generar token único
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expira en 1 hora

    // Eliminar tokens anteriores no usados del mismo usuario
    await (prisma as any).passwordResetToken.deleteMany({
      where: {
        userId: usuario.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    // Crear nuevo token
    await (prisma as any).passwordResetToken.create({
      data: {
        userId: usuario.id,
        token,
        email: usuarioEmail!,
        organizationId: organization.id,
        expiresAt,
      },
    })

    // Enviar email con el enlace de recuperación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/${slug}/reset-password?token=${token}`

    logger.info('Llamando a EmailService.sendPasswordReset', {
      userId: usuario.id,
      email: usuarioEmail,
      resetUrl,
      userName: usuarioNombre,
      organizationName: organization.razonSocial || organization.name || 'Organización',
    })

    const result = await EmailService.sendPasswordReset({
      email: usuarioEmail!,
      resetUrl,
      userName: usuarioNombre,
      organizationName: organization.razonSocial || organization.name || 'Organización',
    })

    logger.info('Resultado de EmailService.sendPasswordReset', {
      success: result.success,
      error: result.error,
      email: usuarioEmail,
    })

    if (!result.success) {
      logger.error('Error al enviar email de recuperación de contraseña', {
        userId: usuario.id,
        email: usuarioEmail,
        error: result.error,
      })
      return NextResponse.json(
        { error: result.error || 'Error al enviar el email de recuperación. Por favor, inténtalo de nuevo más tarde.' },
        { status: 500 }
      )
    }

    logger.info('Token de recuperación de contraseña generado y email enviado exitosamente', {
      userId: usuario.id,
      slug,
      email: usuarioEmail,
    })

    return NextResponse.json({
      success: true,
      message: 'Si el correo existe, se ha enviado un enlace de recuperación',
    })
  } catch (error) {
    logger.error('Error en forgot-password', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

