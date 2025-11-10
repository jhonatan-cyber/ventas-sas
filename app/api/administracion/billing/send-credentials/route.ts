import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/admin/email-service'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('admin-auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const payload = AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId es requerido' },
        { status: 400 }
      )
    }

    // Obtener la factura con la organización y sus relaciones
    const invoice = await (prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            razonSocial: true,
            slug: true,
            ownerId: true,
          }
        }
      }
    })

    if (!invoice || !invoice.organization) {
      return NextResponse.json(
        { error: 'Factura u organización no encontrada' },
        { status: 404 }
      )
    }

    const organization = invoice.organization

    // Obtener el cliente dueño de la organización
    const customer = await prisma.customer.findUnique({
      where: { id: organization.ownerId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        ci: true,
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el usuario SAS (Administrador) de la organización
    const usuarioSas = await prisma.usuarioSas.findFirst({
      where: {
        organizationId: organization.id,
        rol: {
          nombre: 'Administrador'
        }
      },
      select: {
        id: true,
        ci: true,
        correo: true,
        nombre: true,
        apellido: true,
      }
    })

    // Determinar el email y contraseña
    const email = usuarioSas?.email || customer.email || ''
    const password = customer.ci || ''

    if (!email) {
      return NextResponse.json(
        { error: 'No se encontró un email para enviar las credenciales' },
        { status: 404 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'No se encontró una contraseña (CI) para el cliente' },
        { status: 404 }
      )
    }

    // Construir las URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (request.headers.get('origin') || 'http://localhost:3000')
    const landingUrl = `${baseUrl}/${organization.slug}`
    const loginUrl = `${baseUrl}/${organization.slug}/login`

    // Preparar los datos para el email
    const customerName = customer.nombre && customer.apellido
      ? `${customer.nombre} ${customer.apellido}`
      : customer.nombre || customer.apellido || 'Usuario'

    const organizationName = organization.razonSocial || organization.name || 'Organización'

    // Enviar el email
    const result = await EmailService.sendCredentials({
      email,
      password,
      organizationName,
      landingUrl,
      loginUrl,
      customerName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al enviar el email' },
        { status: 500 }
      )
    }

    logger.info('Credenciales enviadas por email', {
      invoiceId,
      organizationId: organization.id,
      email,
      sentBy: payload.userId,
    })

    return NextResponse.json({
      success: true,
      message: 'Credenciales enviadas exitosamente'
    })

  } catch (error) {
    logger.error('Error al enviar credenciales', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

