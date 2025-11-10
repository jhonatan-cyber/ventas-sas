import { Prisma, SubscriptionBillingPeriod, SubscriptionStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { BillingService } from '@/lib/services/admin/billing-service'

export interface CreateSubscriptionData {
  organizationId?: string
  planId: string
  billingPeriod: SubscriptionBillingPeriod
  startDate?: Date
  endDate?: Date
  autoRenew?: boolean
}

export interface UpdateSubscriptionData {
  planId?: string
  status?: SubscriptionStatus
  billingPeriod?: SubscriptionBillingPeriod
  startDate?: Date
  endDate?: Date
  autoRenew?: boolean
}

export class SubscriptionManagementService {
  // Obtener todas las suscripciones
  static async getAllSubscriptions(skip: number = 0, take: number = 10, search?: string, status?: SubscriptionStatus) {
    const where: any = {}

    if (search) {
      where.OR = [
        { organization: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        { organization: { razonSocial: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        { organization: { slug: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        { organization: { customerOrganizations: { some: { customer: { nombre: { contains: search, mode: Prisma.QueryMode.insensitive } } } } } },
        { organization: { customerOrganizations: { some: { customer: { apellido: { contains: search, mode: Prisma.QueryMode.insensitive } } } } } },
        { organization: { customerOrganizations: { some: { customer: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } } } },
        { plan: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              razonSocial: true,
              nit: true,
              address: true,
              phone: true,
              ownerId: true,
              customerOrganizations: {
                where: { isActive: true },
                select: {
                  customer: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      email: true,
                    }
                  }
                },
                take: 1,
              }
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              priceMonthly: true,
              priceYearly: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subscription.count({ where })
    ])

    return { subscriptions, total }
  }

  // Obtener suscripción por ID
  static async getSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            customerOrganizations: {
              where: { isActive: true },
              include: {
                customer: true
              }
            }
          }
        },
        plan: true
      }
    })
  }

  // Crear nueva suscripción
  static async createSubscription(data: CreateSubscriptionData) {
    // Calcular la fecha de finalización basada en el período de facturación
    let endDate = data.endDate
    if (!endDate) {
      const start = data.startDate || new Date()
      const end = new Date(start)
      if (data.billingPeriod === SubscriptionBillingPeriod.yearly) {
        end.setFullYear(end.getFullYear() + 1)
      } else {
        end.setMonth(end.getMonth() + 1)
      }
      endDate = end
    }

    // Obtener el plan y la organización para crear la factura
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId }
    })

    if (!plan) {
      throw new Error('Plan no encontrado')
    }

    let organization = null
    let owner = null

    if (data.organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: data.organizationId },
        include: {
          customerOrganizations: {
            where: { isActive: true },
            include: {
              customer: true
            },
            take: 1
          }
        }
      })

      if (organization) {
        // Obtener el cliente dueño usando ownerId
        owner = await prisma.customer.findUnique({
          where: { id: organization.ownerId }
        })
      }
    }

    if (!organization || !data.organizationId) {
      throw new Error('Organización no encontrada')
    }

    // Crear la suscripción
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: data.organizationId,
        planId: data.planId,
        status: SubscriptionStatus.active,
        billingPeriod: data.billingPeriod,
        startDate: data.startDate || new Date(),
        endDate,
        autoRenew: data.autoRenew ?? true
      },
      include: {
        organization: {
          include: {
            customerOrganizations: {
              where: { isActive: true },
              include: {
                customer: true
              }
            }
          }
        },
        plan: true
      }
    })

    // Generar factura automáticamente
    try {
      // Obtener datos de facturación: el dueño de la empresa (owner)
      const customer = organization.customerOrganizations[0]?.customer
      
      // Usar nombre y apellido del dueño como billingName
      const ownerName = owner ? `${owner.nombre || ''} ${owner.apellido || ''}`.trim() : ''
      const billingName = ownerName || organization.razonSocial || organization.name || 'Cliente'
      
      // El email es requerido, usar el del dueño o un valor por defecto
      const billingEmail = owner?.email || customer?.email || `contacto@${organization.slug || 'empresa'}.com`
      const billingAddress = organization.address || owner?.address || customer?.address || null
      const billingTaxId = organization.nit || null

      // Calcular el precio según el período de facturación
      const price = data.billingPeriod === SubscriptionBillingPeriod.yearly 
        ? (plan.priceYearly ? Number(plan.priceYearly) : 0)
        : (plan.priceMonthly ? Number(plan.priceMonthly) : 0)

      // Usar la fecha de vencimiento de la suscripción (endDate) como fecha de vencimiento de la factura
      const dueDate = endDate

      // Crear la factura
      await BillingService.createInvoice({
        organizationId: organization.id,
        subscriptionId: subscription.id,
        subscriptionPlanId: plan.id,
        billingName,
        billingEmail,
        billingAddress: billingAddress || undefined,
        billingTaxId: billingTaxId || undefined,
        subtotal: price,
        tax: 0, // Se puede agregar lógica para calcular impuestos
        discount: 0,
        currency: 'USD',
        dueDate,
        description: `Factura de suscripción - Plan: ${plan.name} (${data.billingPeriod === SubscriptionBillingPeriod.yearly ? 'Anual' : 'Mensual'})`,
        notes: `Suscripción creada el ${new Date().toLocaleDateString('es-ES')}. Período: ${data.billingPeriod === SubscriptionBillingPeriod.yearly ? 'Anual' : 'Mensual'}`,
        metadata: {
          subscriptionId: subscription.id,
          billingPeriod: data.billingPeriod,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      })
    } catch (error) {
      // Si falla la creación de la factura, loguear el error pero no fallar la suscripción
      console.error('Error al crear factura automática para la suscripción:', error)
      // La suscripción se creó correctamente, solo falló la factura
    }

    return subscription
  }

  // Actualizar suscripción
  static async updateSubscription(id: string, data: UpdateSubscriptionData) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: {
        organization: {
          include: {
            customerOrganizations: {
              where: { isActive: true },
              include: {
                customer: true
              }
            }
          }
        },
        plan: true
      }
    })
  }

  // Eliminar suscripción
  static async deleteSubscription(id: string) {
    return prisma.subscription.delete({
      where: { id }
    })
  }

  // Obtener todas las organizaciones
  static async getAllOrganizations() {
    return prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' }
    })
  }

  // Obtener todos los planes
  static async getAllPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
      },
      orderBy: { name: 'asc' }
    })
  }
}

