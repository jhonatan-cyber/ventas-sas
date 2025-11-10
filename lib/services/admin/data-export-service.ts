import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export type ExportFormat = 'csv' | 'excel' | 'json'
export type ExportType = 'organizations' | 'users' | 'subscriptions' | 'tickets' | 'billing'

export interface ExportOptions {
  format: ExportFormat
  type: ExportType
  filters?: {
    dateFrom?: Date
    dateTo?: Date
    status?: string
    organizationId?: string
  }
}

export class DataExportService {
  /**
   * Exportar organizaciones
   */
  static async exportOrganizations(options: ExportOptions) {
    const startTime = Date.now()
    
    const where: any = {}
    if (options.filters?.dateFrom || options.filters?.dateTo) {
      where.createdAt = {}
      if (options.filters.dateFrom) where.createdAt.gte = options.filters.dateFrom
      if (options.filters.dateTo) where.createdAt.lte = options.filters.dateTo
    }
    if (options.filters?.status) {
      where.subscriptionStatus = options.filters.status
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        subscriptionPlan: {
          select: {
            name: true,
            priceMonthly: true,
            priceYearly: true,
          },
        },
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = organizations.map(org => ({
      id: org.id,
      nombre: org.name,
      slug: org.slug,
      plan: org.subscriptionPlan?.name || 'N/A',
      estado: org.subscriptionStatus,
      fechaInicio: org.subscriptionStartDate?.toISOString() || '',
      fechaFin: org.subscriptionEndDate?.toISOString() || '',
      usuarios: org._count.organizationMembers,
      clientes: org._count.customerOrganizations || 0,
      productos: org._count.products,
      fechaCreacion: org.createdAt.toISOString(),
    }))

    const duration = Date.now() - startTime
    logBusinessOperation('EXPORT', 'DataExport', undefined, undefined, {
      type: 'organizations',
      format: options.format,
      count: data.length,
      duration,
    })

    return this.formatData(data, options.format)
  }

  /**
   * Exportar usuarios
   */
  static async exportUsers(options: ExportOptions) {
    const startTime = Date.now()
    
    const where: any = {}
    if (options.filters?.dateFrom || options.filters?.dateTo) {
      where.createdAt = {}
      if (options.filters.dateFrom) where.createdAt.gte = options.filters.dateFrom
      if (options.filters.dateTo) where.createdAt.lte = options.filters.dateTo
    }
    if (options.filters?.organizationId) {
      where.organizationMembers = {
        some: {
          organizationId: options.filters.organizationId,
        },
      }
    }

    const users = await prisma.profile.findMany({
      where,
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                name: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = users.map((user: any) => ({
      id: user.id,
      nombre: user.fullName || 'N/A',
      email: user.email,
      ci: user.ci || 'N/A',
      rol: user.role,
      superAdmin: user.isSuperAdmin ? 'Sí' : 'No',
      activo: user.isActive ? 'Sí' : 'No',
      organizaciones: (user.organizationMembers || []).map((om: any) => om.organization?.name || 'N/A').join(', '),
      roles: (user.organizationMembers || []).map((om: any) => om.role?.name || 'N/A').join(', '),
      ultimoLogin: user.lastLoginAt?.toISOString() || 'Nunca',
      fechaCreacion: user.createdAt.toISOString(),
    }))

    const duration = Date.now() - startTime
    logBusinessOperation('EXPORT', 'DataExport', undefined, undefined, {
      type: 'users',
      format: options.format,
      count: data.length,
      duration,
    })

    return this.formatData(data, options.format)
  }

  /**
   * Exportar suscripciones
   */
  static async exportSubscriptions(options: ExportOptions) {
    const startTime = Date.now()
    
    const where: any = {}
    if (options.filters?.dateFrom || options.filters?.dateTo) {
      where.createdAt = {}
      if (options.filters.dateFrom) where.createdAt.gte = options.filters.dateFrom
      if (options.filters.dateTo) where.createdAt.lte = options.filters.dateTo
    }
    if (options.filters?.status) {
      where.status = options.filters.status
    }
    if (options.filters?.organizationId) {
      where.organizationId = options.filters.organizationId
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
            priceMonthly: true,
            priceYearly: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = subscriptions.map(sub => ({
      id: sub.id,
      organizacion: sub.organization?.name || 'N/A',
      plan: sub.plan.name,
      estado: sub.status,
      periodo: sub.billingPeriod,
      fechaInicio: sub.startDate.toISOString(),
      fechaFin: sub.endDate?.toISOString() || 'N/A',
      renovacionAutomatica: sub.autoRenew ? 'Sí' : 'No',
      fechaCreacion: sub.createdAt.toISOString(),
      fechaActualizacion: sub.updatedAt.toISOString(),
    }))

    const duration = Date.now() - startTime
    logBusinessOperation('EXPORT', 'DataExport', undefined, undefined, {
      type: 'subscriptions',
      format: options.format,
      count: data.length,
      duration,
    })

    return this.formatData(data, options.format)
  }

  /**
   * Exportar tickets de soporte
   */
  static async exportTickets(options: ExportOptions) {
    // Verificación defensiva
    if (!prisma || !(prisma as any).supportTicket) {
      throw new Error('SupportTicket model not found in Prisma Client.')
    }

    const startTime = Date.now()
    
    const where: any = {}
    if (options.filters?.dateFrom || options.filters?.dateTo) {
      where.createdAt = {}
      if (options.filters.dateFrom) where.createdAt.gte = options.filters.dateFrom
      if (options.filters.dateTo) where.createdAt.lte = options.filters.dateTo
    }
    if (options.filters?.status) {
      where.status = options.filters.status
    }
    if (options.filters?.organizationId) {
      where.organizationId = options.filters.organizationId
    }

    const tickets = await (prisma as any).supportTicket.findMany({
      where,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = tickets.map((ticket: any) => ({
      numero: ticket.ticketNumber,
      organizacion: ticket.organization?.name || 'N/A',
      titulo: ticket.title,
      descripcion: ticket.description.substring(0, 100) + '...',
      estado: ticket.status,
      prioridad: ticket.priority,
      categoria: ticket.category || 'N/A',
      creadoPor: ticket.createdBy?.fullName || ticket.createdBy?.email || 'N/A',
      asignadoA: ticket.assignedTo?.fullName || ticket.assignedTo?.email || 'Sin asignar',
      comentarios: ticket._count.comments,
      archivos: ticket._count.attachments,
      fechaCreacion: ticket.createdAt.toISOString(),
      fechaResolucion: ticket.resolvedAt?.toISOString() || 'N/A',
    }))

    const duration = Date.now() - startTime
    logBusinessOperation('EXPORT', 'DataExport', undefined, undefined, {
      type: 'tickets',
      format: options.format,
      count: data.length,
      duration,
    })

    return this.formatData(data, options.format)
  }

  /**
   * Exportar facturación
   */
  static async exportBilling(options: ExportOptions) {
    // Verificación defensiva
    if (!prisma || !(prisma as any).invoice) {
      throw new Error('Invoice model not found in Prisma Client.')
    }

    const startTime = Date.now()
    
    const where: any = {}
    if (options.filters?.dateFrom || options.filters?.dateTo) {
      where.createdAt = {}
      if (options.filters.dateFrom) where.createdAt.gte = options.filters.dateFrom
      if (options.filters.dateTo) where.createdAt.lte = options.filters.dateTo
    }
    if (options.filters?.status) {
      where.status = options.filters.status
    }
    if (options.filters?.organizationId) {
      where.organizationId = options.filters.organizationId
    }

    const invoices = await (prisma as any).invoice.findMany({
      where,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = invoices.map((invoice: any) => {
      const totalPaid = invoice.payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

      return {
        numero: invoice.invoiceNumber,
        organizacion: invoice.organization?.name || 'N/A',
        monto: Number(invoice.total).toFixed(2),
        pagado: totalPaid.toFixed(2),
        pendiente: (Number(invoice.total) - totalPaid).toFixed(2),
        estado: invoice.status,
        fechaEmision: invoice.issueDate?.toISOString() || 'N/A',
        fechaVencimiento: invoice.dueDate?.toISOString() || 'N/A',
        fechaCreacion: invoice.createdAt.toISOString(),
      }
    })

    const duration = Date.now() - startTime
    logBusinessOperation('EXPORT', 'DataExport', undefined, undefined, {
      type: 'billing',
      format: options.format,
      count: data.length,
      duration,
    })

    return this.formatData(data, options.format)
  }

  /**
   * Formatear datos según el formato solicitado
   */
  private static formatData(data: any[], format: ExportFormat): { content: string; mimeType: string; extension: string } {
    switch (format) {
      case 'json':
        return {
          content: JSON.stringify(data, null, 2),
          mimeType: 'application/json',
          extension: 'json',
        }

      case 'csv':
        if (data.length === 0) {
          return {
            content: '',
            mimeType: 'text/csv',
            extension: 'csv',
          }
        }

        // Obtener headers
        const headers = Object.keys(data[0])
        const csvRows = [headers.join(',')]

        // Agregar rows
        for (const row of data) {
          const values = headers.map(header => {
            const value = row[header] || ''
            // Escapar comillas y envolver en comillas si contiene comas
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          csvRows.push(values.join(','))
        }

        return {
          content: csvRows.join('\n'),
          mimeType: 'text/csv; charset=utf-8',
          extension: 'csv',
        }

      case 'excel':
        // Para Excel, usaremos CSV con BOM UTF-8 (compatible con Excel)
        const csv = this.formatData(data, 'csv')
        return {
          content: '\ufeff' + csv.content, // BOM UTF-8
          mimeType: 'application/vnd.ms-excel',
          extension: 'xls',
        }

      default:
        throw new Error(`Formato no soportado: ${format}`)
    }
  }

  /**
   * Método principal de exportación
   */
  static async export(options: ExportOptions) {
    switch (options.type) {
      case 'organizations':
        return this.exportOrganizations(options)
      case 'users':
        return this.exportUsers(options)
      case 'subscriptions':
        return this.exportSubscriptions(options)
      case 'tickets':
        return this.exportTickets(options)
      case 'billing':
        return this.exportBilling(options)
      default:
        throw new Error(`Tipo de exportación no soportado: ${options.type}`)
    }
  }
}
