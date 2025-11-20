import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/admin/email-service'
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

    const payload = await AdminJWTService.verifyToken(token)
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
            customerOrganizations: {
              where: {
                isActive: true
              },
              include: {
                customer: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                    ci: true,
                    isActive: true,
                    deletedAt: true,
                  }
                }
              },
              take: 1,
            },
            owner: {
              select: {
                id: true,
                email: true,
                fullName: true,
              }
            }
          }
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                priceMonthly: true,
                priceYearly: true,
              }
            }
          }
        }
      }
    })

    // Verificar si es la primera factura pagada de esta organización
    const paidInvoicesCount = await (prisma as any).invoice.count({
      where: {
        organizationId: invoice.organization.id,
        status: 'paid',
        id: {
          not: invoiceId // Excluir la factura actual
        }
      }
    })
    const isFirstInvoice = paidInvoicesCount === 0 && invoice.status === 'paid'

    if (!invoice || !invoice.organization) {
      return NextResponse.json(
        { error: 'Factura u organización no encontrada' },
        { status: 404 }
      )
    }

    const organization = invoice.organization

    // Obtener el cliente a través de customerOrganizations
    // El email siempre debe venir de la tabla Customer ya que el cliente puede modificarlo
    const customerOrganization = organization.customerOrganizations?.[0]
    const customer = customerOrganization?.customer

    // Validar que haya un cliente activo
    if (!customer || customer.deletedAt || !customer.isActive) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo. La organización debe tener un cliente activo asociado.' },
        { status: 404 }
      )
    }

    // El email siempre se obtiene de la tabla Customer
    const email = customer.email
    const password = customer.ci || ''
    // El username puede ser el correo o el CI (el usuario puede iniciar sesión con cualquiera)
    // Mostramos ambos en el email para que el usuario sepa que puede usar cualquiera
    const username = customer.email || customer.ci || ''
    const customerName = customer.nombre && customer.apellido
      ? `${customer.nombre} ${customer.apellido}`
      : customer.nombre || customer.apellido || 'Usuario'


    if (!email) {
      return NextResponse.json(
        { error: 'No se encontró un email para enviar las credenciales. La organización no tiene un usuario SAS ni un cliente asociado con email.' },
        { status: 404 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'No se encontró una contraseña (CI) para enviar las credenciales. El usuario o cliente no tiene CI configurado.' },
        { status: 404 }
      )
    }

    // Construir las URLs
    // Por ahora usar localhost:3000, luego se puede cambiar desde variables de entorno
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const landingUrl = `${baseUrl}/${organization.slug}`
    const loginUrl = `${baseUrl}/${organization.slug}/login`

    const organizationName = organization.razonSocial || organization.name || 'Organización'
    const ownerName = organization.owner?.fullName || null
    const ownerEmail = organization.owner?.email || null

    // Obtener información del plan y suscripción
    const planName = invoice.subscription?.plan?.name || null
    const planDescription = invoice.subscription?.plan?.description || null
    
    // Obtener el precio del plan según el periodo de facturación
    let planPrice = null
    if (invoice.subscription?.plan) {
      const plan = invoice.subscription.plan
      const billingPeriod = invoice.subscription.billingPeriod
      
      if (billingPeriod === 'monthly' && plan.priceMonthly) {
        const price = Number(plan.priceMonthly)
        planPrice = new Intl.NumberFormat('es-BO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price) + ' Bs/mes'
      } else if (billingPeriod === 'yearly' && plan.priceYearly) {
        const price = Number(plan.priceYearly)
        planPrice = new Intl.NumberFormat('es-BO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price) + ' Bs/año'
      }
    }
    
    const subscriptionPeriod = invoice.subscription?.billingPeriod 
      ? (invoice.subscription.billingPeriod === 'monthly' ? 'Mensual' : 'Anual')
      : undefined
    const subscriptionStatus = invoice.subscription?.status
      ? (invoice.subscription.status === 'active' ? 'Activo' :
         invoice.subscription.status === 'trial' ? 'Prueba' :
         invoice.subscription.status === 'suspended' ? 'Suspendido' :
         invoice.subscription.status === 'cancelled' ? 'Cancelado' :
         invoice.subscription.status === 'expired' ? 'Expirado' : invoice.subscription.status)
      : undefined

    // Enviar el email
    const result = await EmailService.sendCredentials({
      email,
      password,
      username,
      organizationName,
      organizationSlug: organization.slug,
      landingUrl,
      loginUrl,
      customerName,
      ownerName: ownerName || undefined,
      ownerEmail: ownerEmail || undefined,
      planName: planName || undefined,
      planDescription: planDescription || undefined,
      planPrice: planPrice || undefined,
      subscriptionPeriod,
      subscriptionStatus,
      isFirstInvoice,
    })

    logger.info('Llamando a EmailService.sendCredentials', {
      email,
      organizationName: organization.razonSocial || organization.name,
      isFirstInvoice,
    })

    if (!result.success) {
      logger.error('Error al enviar credenciales por email', {
        error: result.error,
        email,
        invoiceId,
      })
      return NextResponse.json(
        { error: result.error || 'Error al enviar el email' },
        { status: 500 }
      )
    }

    logger.info('Credenciales enviadas por email exitosamente', {
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

