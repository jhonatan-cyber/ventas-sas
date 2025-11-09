import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface InvoiceFilters {
  organizationId?: string
  subscriptionId?: string
  status?: string | string[]
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface InvoiceWithRelations {
  id: string
  invoiceNumber: string
  organizationId: string | null
  subscriptionId: string | null
  subscriptionPlanId: string | null
  billingName: string
  billingEmail: string
  billingAddress: string | null
  billingTaxId: string | null
  subtotal: Decimal
  tax: Decimal
  discount: Decimal
  total: Decimal
  currency: string
  status: string
  issueDate: Date
  dueDate: Date
  paidAt: Date | null
  paymentMethodId: string | null
  paymentGateway: string | null
  paymentGatewayId: string | null
  paymentLink: string | null
  reminderSentAt: Date | null
  reminderCount: number
  description: string | null
  notes: string | null
  metadata: any
  createdAt: Date
  updatedAt: Date
  organization?: {
    id: string
    name: string
    slug: string
  } | null
  subscription?: {
    id: string
    status: string
    billingPeriod: string
  } | null
  subscriptionPlan?: {
    id: string
    name: string
  } | null
  paymentMethod?: {
    id: string
    label: string
    type: string
    last4: string | null
    brand: string | null
  } | null
  payments?: Array<{
    id: string
    amount: Decimal
    status: string
    paidAt: Date | null
    paymentGateway: string
    createdAt: Date
  }>
  _count?: {
    payments: number
  }
}

export interface CreateInvoiceData {
  organizationId?: string
  subscriptionId?: string
  subscriptionPlanId?: string
  billingName: string
  billingEmail: string
  billingAddress?: string
  billingTaxId?: string
  subtotal: number
  tax?: number
  discount?: number
  currency?: string
  dueDate: Date
  description?: string
  notes?: string
  metadata?: any
}

export interface CreatePaymentData {
  invoiceId: string
  amount: number
  paymentMethodId?: string
  paymentGateway: string
  paymentGatewayId?: string
  paymentIntentId?: string
  paymentMethodType?: string
  last4?: string
  brand?: string
  metadata?: any
}

export interface BillingStats {
  totalRevenue: Decimal
  pendingAmount: Decimal
  overdueAmount: Decimal
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  revenueByMonth: Array<{ month: string; revenue: Decimal }>
  revenueByGateway: Array<{ gateway: string; revenue: Decimal }>
}

export class BillingService {
  /**
   * Generar número de factura único
   */
  private static async generateInvoiceNumber(): Promise<string> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice || typeof (prisma as any).invoice.findFirst !== 'function') {
      throw new Error('El modelo Invoice no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const year = new Date().getFullYear()
    const prefix = `INV-${year}-`
    
    // Buscar el último número de factura del año
    const lastInvoice = await (prisma as any).invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    })

    if (!lastInvoice) {
      return `${prefix}0001`
    }

    // Extraer el número y incrementar
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''))
    const newNumber = (lastNumber + 1).toString().padStart(4, '0')
    
    return `${prefix}${newNumber}`
  }

  /**
   * Crear una nueva factura
   */
  static async createInvoice(data: CreateInvoiceData): Promise<InvoiceWithRelations> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice || typeof (prisma as any).invoice.create !== 'function') {
      throw new Error('El modelo Invoice no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const invoiceNumber = await this.generateInvoiceNumber()
    
    const invoice = await (prisma as any).invoice.create({
      data: {
        invoiceNumber,
        organizationId: data.organizationId || null,
        subscriptionId: data.subscriptionId || null,
        subscriptionPlanId: data.subscriptionPlanId || null,
        billingName: data.billingName,
        billingEmail: data.billingEmail,
        billingAddress: data.billingAddress || null,
        billingTaxId: data.billingTaxId || null,
        subtotal: data.subtotal,
        tax: data.tax || 0,
        discount: data.discount || 0,
        total: data.subtotal - (data.discount || 0) + (data.tax || 0),
        currency: data.currency || 'USD',
        dueDate: data.dueDate,
        description: data.description || null,
        notes: data.notes || null,
        metadata: data.metadata || {},
        status: 'pending',
        issueDate: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        subscription: {
          select: {
            id: true,
            status: true,
            billingPeriod: true,
          }
        },
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
          }
        },
        paymentMethod: {
          select: {
            id: true,
            label: true,
            type: true,
            last4: true,
            brand: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            paymentGateway: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            payments: true,
          }
        }
      }
    })

    return invoice as InvoiceWithRelations
  }

  /**
   * Obtener facturas con filtros y paginación
   */
  static async getInvoices(
    filters: InvoiceFilters = {},
    skip: number = 0,
    take: number = 50
  ): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice || typeof (prisma as any).invoice.findMany !== 'function') {
      console.warn('El modelo Invoice no está disponible en Prisma Client. Ejecuta: pnpm db:generate')
      return { invoices: [], total: 0 }
    }

    const where: any = {}

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status }
      } else {
        where.status = filters.status
      }
    }

    if (filters.startDate || filters.endDate) {
      where.issueDate = {}
      if (filters.startDate) {
        where.issueDate.gte = filters.startDate
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        where.issueDate.lte = endDate
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { billingName: { contains: filters.search, mode: 'insensitive' } },
        { billingEmail: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    try {
      const [invoices, total] = await Promise.all([
        (prisma as any).invoice.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          subscription: {
            select: {
              id: true,
              status: true,
              billingPeriod: true,
            }
          },
          subscriptionPlan: {
            select: {
              id: true,
              name: true,
            }
          },
          paymentMethod: {
            select: {
              id: true,
              label: true,
              type: true,
              last4: true,
              brand: true,
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true,
              paymentGateway: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              payments: true,
            }
          }
        }
      }),
        (prisma as any).invoice.count({ where })
      ])

      return {
        invoices: invoices as InvoiceWithRelations[],
        total
      }
    } catch (error: any) {
      console.warn('Error al obtener facturas (esto es normal si aún no se ha ejecutado la migración):', error.message)
      return { invoices: [], total: 0 }
    }
  }

  /**
   * Obtener una factura por ID
   */
  static async getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice || typeof (prisma as any).invoice.findUnique !== 'function') {
      console.warn('El modelo Invoice no está disponible en Prisma Client. Ejecuta: pnpm db:generate')
      return null
    }

    try {
      const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        subscription: {
          select: {
            id: true,
            status: true,
            billingPeriod: true,
          }
        },
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
          }
        },
        paymentMethod: {
          select: {
            id: true,
            label: true,
            type: true,
            last4: true,
            brand: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            paymentGateway: true,
            paymentMethodType: true,
            last4: true,
            brand: true,
            errorMessage: true,
            receiptUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            payments: true,
          }
        }
      }
      })

      return invoice as InvoiceWithRelations | null
    } catch (error: any) {
      console.warn('Error al obtener factura (esto es normal si aún no se ha ejecutado la migración):', error.message)
      return null
    }
  }

  /**
   * Registrar un pago
   */
  static async createPayment(data: CreatePaymentData): Promise<any> {
    // Verificar si los modelos existen en Prisma Client
    if (!prisma || !(prisma as any).invoice || !(prisma as any).payment) {
      throw new Error('Los modelos Invoice/Payment no están disponibles. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id: data.invoiceId }
    })

    if (!invoice) {
      throw new Error('Factura no encontrada')
    }

    // Crear el pago
    // Para pagos manuales, marcarlos como completados automáticamente
    const isManualPayment = data.paymentGateway === 'manual'
    const payment = await (prisma as any).payment.create({
      data: {
        invoiceId: data.invoiceId,
        paymentMethodId: data.paymentMethodId || null,
        amount: data.amount,
        currency: invoice.currency,
        status: isManualPayment || data.paymentGatewayId ? 'completed' : 'pending',
        paymentGateway: data.paymentGateway,
        paymentGatewayId: data.paymentGatewayId || null,
        paymentIntentId: data.paymentIntentId || null,
        paymentMethodType: data.paymentMethodType || null,
        last4: data.last4 || null,
        brand: data.brand || null,
        metadata: data.metadata || {},
        paidAt: isManualPayment || data.paymentGatewayId ? new Date() : null,
      }
    })

    // Calcular el total pagado
    const totalPaid = await (prisma as any).payment.aggregate({
      where: {
        invoiceId: data.invoiceId,
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    // Actualizar el estado de la factura
    const totalPaidAmount = totalPaid._sum.amount || 0
    const invoiceTotal = invoice.total

    let newStatus = invoice.status
    if (totalPaidAmount >= invoiceTotal) {
      newStatus = 'paid'
    } else if (invoice.dueDate < new Date() && totalPaidAmount < invoiceTotal) {
      newStatus = 'overdue'
    }

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
      }
    })

    return payment
  }

  /**
   * Actualizar estado de pago
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    // Verificar si los modelos existen en Prisma Client
    if (!prisma || !(prisma as any).payment || !(prisma as any).invoice) {
      throw new Error('Los modelos Payment/Invoice no están disponibles. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const payment = await (prisma as any).payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true }
    })

    if (!payment) {
      throw new Error('Pago no encontrado')
    }

    const updateData: any = {
      status,
      processedAt: status === 'completed' ? new Date() : payment.processedAt,
      failedAt: status === 'failed' ? new Date() : payment.failedAt,
      paidAt: status === 'completed' ? new Date() : payment.paidAt,
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage
    }

    await (prisma as any).payment.update({
      where: { id: paymentId },
      data: updateData
    })

    // Recalcular estado de factura
    const totalPaid = await (prisma as any).payment.aggregate({
      where: {
        invoiceId: payment.invoiceId,
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const totalPaidAmount = totalPaid._sum.amount || 0
    const invoiceTotal = payment.invoice.total

    let newInvoiceStatus = payment.invoice.status
    if (totalPaidAmount >= invoiceTotal) {
      newInvoiceStatus = 'paid'
    } else if (payment.invoice.dueDate < new Date() && totalPaidAmount < invoiceTotal) {
      newInvoiceStatus = 'overdue'
    }

    await (prisma as any).invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: newInvoiceStatus,
        paidAt: newInvoiceStatus === 'paid' ? new Date() : payment.invoice.paidAt,
      }
    })
  }

  /**
   * Obtener estadísticas de facturación
   */
  static async getBillingStats(
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BillingStats> {
    // Verificar si los modelos existen en Prisma Client
    if (!prisma || !(prisma as any).invoice || !(prisma as any).payment) {
      console.warn('Los modelos Invoice/Payment no están disponibles. Ejecuta: pnpm db:generate')
      return {
        totalRevenue: new Decimal(0),
        pendingAmount: new Decimal(0),
        overdueAmount: new Decimal(0),
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        revenueByMonth: [],
        revenueByGateway: [],
      }
    }

    try {
      const where: any = {}

      if (organizationId) {
        where.organizationId = organizationId
      }

      if (startDate || endDate) {
        where.issueDate = {}
        if (startDate) {
          where.issueDate.gte = startDate
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          where.issueDate.lte = end
        }
      }

      // Total revenue (solo facturas pagadas)
      const totalRevenue = await (prisma as any).payment.aggregate({
      where: {
        status: 'completed',
        invoice: where
      },
      _sum: {
        amount: true
      }
    })

      // Montos pendientes y vencidos - obtener facturas con sus pagos
      const pendingInvoices = await (prisma as any).invoice.findMany({
      where: {
        ...where,
        status: 'pending'
      },
      include: {
        payments: {
          where: {
            status: 'completed'
          },
          select: {
            amount: true
          }
        }
      }
    })

      const overdueInvoices = await (prisma as any).invoice.findMany({
      where: {
        ...where,
        status: 'overdue'
      },
      include: {
        payments: {
          where: {
            status: 'completed'
          },
          select: {
            amount: true
          }
        }
      }
    })

    const pendingAmount = pendingInvoices.reduce(
      (sum, inv) => {
        const totalPaid = inv.payments.reduce((paid, payment) => paid + Number(payment.amount), 0)
        const remaining = Number(inv.total) - totalPaid
        return sum.plus(remaining > 0 ? remaining : 0)
      },
      new Decimal(0)
    )

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => {
        const totalPaid = inv.payments.reduce((paid, payment) => paid + Number(payment.amount), 0)
        const remaining = Number(inv.total) - totalPaid
        return sum.plus(remaining > 0 ? remaining : 0)
      },
      new Decimal(0)
    )

      // Conteos
      const [totalInvoices, paidInvoices, pendingCount, overdueCount] = await Promise.all([
        (prisma as any).invoice.count({ where }),
        (prisma as any).invoice.count({ where: { ...where, status: 'paid' } }),
        (prisma as any).invoice.count({ where: { ...where, status: 'pending' } }),
        (prisma as any).invoice.count({ where: { ...where, status: 'overdue' } }),
      ])

      // Revenue por mes (últimos 12 meses)
      const revenueByMonthData = await (prisma as any).payment.findMany({
      where: {
        status: 'completed',
        invoice: where,
        paidAt: {
          gte: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        amount: true,
        paidAt: true,
      }
    })

    const revenueByMonthMap = new Map<string, Decimal>()
    revenueByMonthData.forEach(payment => {
      if (payment.paidAt) {
        const month = payment.paidAt.toISOString().slice(0, 7) // YYYY-MM
        const current = revenueByMonthMap.get(month) || new Decimal(0)
        revenueByMonthMap.set(month, current.plus(payment.amount))
      }
    })

    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))

      // Revenue por gateway
      const revenueByGatewayData = await (prisma as any).payment.groupBy({
      by: ['paymentGateway'],
      where: {
        status: 'completed',
        invoice: where
      },
      _sum: {
        amount: true
      }
    })

    const revenueByGateway = revenueByGatewayData.map(item => ({
      gateway: item.paymentGateway,
      revenue: item._sum.amount || new Decimal(0)
    }))

      return {
        totalRevenue: totalRevenue._sum.amount || new Decimal(0),
        pendingAmount,
        overdueAmount,
        totalInvoices,
        paidInvoices,
        pendingInvoices: pendingCount,
        overdueInvoices: overdueCount,
        revenueByMonth,
        revenueByGateway,
      }
    } catch (error: any) {
      console.warn('Error al obtener estadísticas de facturación (esto es normal si aún no se ha ejecutado la migración):', error.message)
      return {
        totalRevenue: new Decimal(0),
        pendingAmount: new Decimal(0),
        overdueAmount: new Decimal(0),
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        revenueByMonth: [],
        revenueByGateway: [],
      }
    }
  }

  /**
   * Obtener métodos de pago de una organización
   */
  static async getPaymentMethods(organizationId: string) {
    // Verificar si el modelo PaymentMethod existe en Prisma Client
    if (!prisma || !(prisma as any).paymentMethod || typeof (prisma as any).paymentMethod.findMany !== 'function') {
      console.warn('El modelo PaymentMethod no está disponible en Prisma Client. Ejecuta: pnpm db:generate')
      return []
    }

    try {
      return await (prisma as any).paymentMethod.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
      })
    } catch (error: any) {
      console.warn('Error al obtener métodos de pago (esto es normal si aún no se ha ejecutado la migración):', error.message)
      return []
    }
  }

  /**
   * Crear método de pago
   */
  static async createPaymentMethod(data: {
    organizationId?: string
    type: string
    provider: string
    label: string
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    gatewayId?: string
    isDefault?: boolean
    metadata?: any
  }) {
    // Verificar si el modelo PaymentMethod existe en Prisma Client
    if (!prisma || !(prisma as any).paymentMethod || typeof (prisma as any).paymentMethod.create !== 'function') {
      throw new Error('El modelo PaymentMethod no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    // Si es el método por defecto, desactivar otros
    if (data.isDefault && data.organizationId) {
      await (prisma as any).paymentMethod.updateMany({
        where: {
          organizationId: data.organizationId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    return (prisma as any).paymentMethod.create({
      data: {
        organizationId: data.organizationId || null,
        type: data.type,
        provider: data.provider,
        label: data.label,
        last4: data.last4 || null,
        brand: data.brand || null,
        expiryMonth: data.expiryMonth || null,
        expiryYear: data.expiryYear || null,
        gatewayId: data.gatewayId || null,
        isDefault: data.isDefault || false,
        metadata: data.metadata || {},
      }
    })
  }

  /**
   * Actualizar mÃ©todo de pago
   */
  static async updatePaymentMethod(
    id: string,
    data: {
      label?: string
      last4?: string
      brand?: string
      expiryMonth?: number
      expiryYear?: number
      isActive?: boolean
      metadata?: any
    }
  ) {
    // Verificar si el modelo PaymentMethod existe en Prisma Client
    if (!prisma || !(prisma as any).paymentMethod || typeof (prisma as any).paymentMethod.update !== 'function') {
      throw new Error('El modelo PaymentMethod no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    return (prisma as any).paymentMethod.update({
      where: { id },
      data: {
        label: data.label,
        last4: data.last4,
        brand: data.brand,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        isActive: data.isActive,
        metadata: data.metadata,
      }
    })
  }

  /**
   * Establecer mÃ©todo de pago como predeterminado
   */
  static async setDefaultPaymentMethod(id: string): Promise<void> {
    // Verificar si el modelo PaymentMethod existe en Prisma Client
    if (!prisma || !(prisma as any).paymentMethod) {
      throw new Error('El modelo PaymentMethod no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const paymentMethod = await (prisma as any).paymentMethod.findUnique({
      where: { id },
      select: { organizationId: true }
    })

    if (!paymentMethod) {
      throw new Error('MÃ©todo de pago no encontrado')
    }

    // Si tiene organizaciÃ³n, desactivar otros mÃ©todos por defecto de la misma organizaciÃ³n
    if (paymentMethod.organizationId) {
      await (prisma as any).paymentMethod.updateMany({
        where: {
          organizationId: paymentMethod.organizationId,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // Establecer este como predeterminado
    await (prisma as any).paymentMethod.update({
      where: { id },
      data: {
        isDefault: true,
        isActive: true
      }
    })
  }

  /**
   * Eliminar (desactivar) mÃ©todo de pago
   */
  static async deletePaymentMethod(id: string): Promise<void> {
    // Verificar si el modelo PaymentMethod existe en Prisma Client
    if (!prisma || !(prisma as any).paymentMethod) {
      throw new Error('El modelo PaymentMethod no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const paymentMethod = await (prisma as any).paymentMethod.findUnique({
      where: { id },
      select: { isDefault: true }
    })

    if (!paymentMethod) {
      throw new Error('MÃ©todo de pago no encontrado')
    }

    // Si es el mÃ©todo por defecto, no permitir eliminaciÃ³n directa
    // En su lugar, desactivarlo
    await (prisma as any).paymentMethod.update({
      where: { id },
      data: {
        isActive: false,
        isDefault: false
      }
    })
  }

  /**
   * Enviar recordatorio de pago
   */
  static async sendPaymentReminder(invoiceId: string): Promise<void> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice) {
      throw new Error('El modelo Invoice no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      throw new Error('Factura no encontrada')
    }

    // Incrementar contador de recordatorios
    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        reminderCount: invoice.reminderCount + 1,
        reminderSentAt: new Date(),
      }
    })

    // Aquí se integraría con el sistema de notificaciones/email
    // TODO: Enviar email de recordatorio
  }

  /**
   * Cancelar factura
   */
  static async cancelInvoice(invoiceId: string): Promise<void> {
    // Verificar si el modelo Invoice existe en Prisma Client
    if (!prisma || !(prisma as any).invoice) {
      throw new Error('El modelo Invoice no está disponible. Ejecuta: pnpm db:generate && pnpm db:migrate dev')
    }

    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'cancelled'
      }
    })
  }
}
