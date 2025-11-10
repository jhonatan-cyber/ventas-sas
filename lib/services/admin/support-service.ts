import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import { logDatabase, logBusinessOperation } from '@/lib/utils/logger'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'billing' | 'technical' | 'other'

export interface CreateTicketData {
  organizationId: string
  createdById?: string
  title: string
  description: string
  priority?: TicketPriority
  category?: TicketCategory
}

export interface UpdateTicketData {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  assignedToId?: string | null
}

export interface CreateCommentData {
  ticketId: string
  authorId: string
  authorType: 'admin' | 'organization' | 'system'
  content: string
  isInternal?: boolean
}

export interface TicketFilters {
  organizationId?: string
  assignedToId?: string | null
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  search?: string
}

export interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  averageResponseTime: number // En horas
  averageResolutionTime: number // En horas
}

export class SupportService {
  /**
   * Generar número de ticket único
   */
    private static async generateTicketNumber(): Promise<string> {
    // Verificación defensiva
    if (!prisma || !(prisma as any).supportTicket) {
      throw new Error('SupportTicket model not found in Prisma Client. Please run: pnpm db:generate')
    }

    const prefix = 'TICK'
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    // Contar tickets del mes actual
    const startOfMonth = new Date(year, date.getMonth(), 1)
    const count = await (prisma as any).supportTicket.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `${prefix}-${year}${month}-${sequence}`
  }

  /**
   * Crear un nuevo ticket
   */
    static async createTicket(data: CreateTicketData) {
    // Verificación defensiva
    if (!prisma || !(prisma as any).supportTicket) {
      throw new Error('SupportTicket model not found in Prisma Client. Please run: pnpm db:generate')
    }

    const startTime = Date.now()

    const ticketNumber = await this.generateTicketNumber()

    const ticket = await (prisma as any).supportTicket.create({
      data: {
        ticketNumber,
        organizationId: data.organizationId,
        createdById: data.createdById || null,
        title: data.title,
        description: data.description,
        status: 'open',
        priority: data.priority || 'medium',
        category: data.category || 'other',
      },
      include: {
        organization: true,
        createdBy: true,
        assignedTo: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    // Registrar en historial
    await (prisma as any).ticketHistory.create({
      data: {
        ticketId: ticket.id,
        changedById: data.createdById || null,
        changeType: 'created',
        newValue: ticket.status,
        description: `Ticket creado: ${ticket.title}`,
      },
    })

    // Notificar a todos los administradores
    await NotificationService.sendBulkToAllAdmins(
      'system',
      'Nuevo Ticket de Soporte',
      `Nuevo ticket ${ticketNumber}: ${data.title}`,
      {
        ticketId: ticket.id,
        ticketNumber,
        organizationId: data.organizationId,
        organizationName: ticket.organization.name,
      },
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    ).catch((error) => {
      logDatabase('NOTIFICATION_ERROR', 'notifications', undefined, error as Error, {
        ticketId: ticket.id,
      })
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE', 'support_tickets', duration, undefined, {
      ticketId: ticket.id,
      ticketNumber,
    })

    logBusinessOperation('CREATE', 'SupportTicket', ticket.id, undefined, {
      ticketNumber,
      organizationId: data.organizationId,
    })

    return ticket
  }

  /**
   * Obtener tickets con filtros y paginación
   */
  static async getTickets(
    filters: TicketFilters = {},
    skip: number = 0,
    take: number = 50
  ) {
    // Verificación defensiva: si el modelo no existe, retornar valores por defecto
    if (!prisma || !(prisma as any).supportTicket) {
      console.warn('SupportTicket model not found in Prisma Client. Please run: pnpm db:generate')
      return { tickets: [], total: 0 }
    }

    const where: any = {}

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.assignedToId !== undefined) {
      if (filters.assignedToId === null) {
        where.assignedToId = null
      } else {
        where.assignedToId = filters.assignedToId
      }
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.priority) {
      where.priority = filters.priority
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [tickets, total] = await Promise.all([
      (prisma as any).supportTicket.findMany({
        where,
        skip,
        take,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
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
        orderBy: [
          { priority: 'desc' }, // urgent > high > medium > low
          { createdAt: 'desc' },
        ],
      }),
      prisma.supportTicket.count({ where }),
    ])

    return { tickets, total }
  }

  /**
   * Obtener ticket por ID
   */
  static async getTicketById(id: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        comments: {
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        history: {
          include: {
            changedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    })

    return ticket
  }

  /**
   * Actualizar ticket
   */
  static async updateTicket(id: string, data: UpdateTicketData, changedById?: string) {
    const startTime = Date.now()
    
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!existingTicket) {
      throw new Error('Ticket no encontrado')
    }

    const updateData: any = {}
    const historyEntries: any[] = []

    if (data.title !== undefined && data.title !== existingTicket.title) {
      updateData.title = data.title
      historyEntries.push({
        ticketId: id,
        changedById: changedById || null,
        changeType: 'title_changed',
        oldValue: existingTicket.title,
        newValue: data.title,
        description: `Título cambiado`,
      })
    }

    if (data.description !== undefined && data.description !== existingTicket.description) {
      updateData.description = data.description
    }

    if (data.status !== undefined && data.status !== existingTicket.status) {
      updateData.status = data.status
      
      if (data.status === 'resolved' && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date()
      }
      
      if (data.status === 'closed' && !existingTicket.closedAt) {
        updateData.closedAt = new Date()
      }
      
      historyEntries.push({
        ticketId: id,
        changedById: changedById || null,
        changeType: 'status_changed',
        oldValue: existingTicket.status,
        newValue: data.status,
        description: `Estado cambiado de ${existingTicket.status} a ${data.status}`,
      })
    }

    if (data.priority !== undefined && data.priority !== existingTicket.priority) {
      updateData.priority = data.priority
      historyEntries.push({
        ticketId: id,
        changedById: changedById || null,
        changeType: 'priority_changed',
        oldValue: existingTicket.priority,
        newValue: data.priority,
        description: `Prioridad cambiada de ${existingTicket.priority} a ${data.priority}`,
      })
    }

    if (data.category !== undefined && data.category !== existingTicket.category) {
      updateData.category = data.category
      historyEntries.push({
        ticketId: id,
        changedById: changedById || null,
        changeType: 'category_changed',
        oldValue: existingTicket.category || '',
        newValue: data.category || '',
        description: `Categoría cambiada`,
      })
    }

    if (data.assignedToId !== undefined && data.assignedToId !== existingTicket.assignedToId) {
      updateData.assignedToId = data.assignedToId
      historyEntries.push({
        ticketId: id,
        changedById: changedById || null,
        changeType: 'assigned',
        oldValue: existingTicket.assignedToId || 'sin asignar',
        newValue: data.assignedToId || 'sin asignar',
        description: data.assignedToId ? 'Ticket asignado' : 'Ticket desasignado',
      })
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.supportTicket.update({
        where: { id },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
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
      })

      // Registrar cambios en historial
      if (historyEntries.length > 0) {
        await tx.ticketHistory.createMany({
          data: historyEntries,
        })
      }

      return updatedTicket
    })

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'support_tickets', duration, undefined, {
      ticketId: id,
    })

    logBusinessOperation('UPDATE', 'SupportTicket', id, undefined, {
      changes: Object.keys(updateData),
    })

    return ticket
  }

  /**
   * Agregar comentario a un ticket
   */
  static async addComment(data: CreateCommentData) {
    const startTime = Date.now()
    
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
    })

    if (!ticket) {
      throw new Error('Ticket no encontrado')
    }

    // Si es el primer comentario de un admin y el ticket no tiene firstResponseAt, actualizarlo
    const isFirstAdminResponse = 
      data.authorType === 'admin' && 
      !ticket.firstResponseAt

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.ticketComment.create({
        data: {
          ticketId: data.ticketId,
          authorId: data.authorId,
          authorType: data.authorType,
          content: data.content,
          isInternal: data.isInternal || false,
        },
        include: {
          attachments: true,
        },
      })

      // Actualizar firstResponseAt si es necesario
      if (isFirstAdminResponse) {
        await tx.supportTicket.update({
          where: { id: data.ticketId },
          data: {
            firstResponseAt: new Date(),
          },
        })
      }

      // Registrar en historial
      await tx.ticketHistory.create({
        data: {
          ticketId: data.ticketId,
          changedById: data.authorId,
          changeType: 'comment_added',
          description: `Comentario agregado por ${data.authorType}`,
        },
      })

      return newComment
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE', 'ticket_comments', duration, undefined, {
      commentId: comment.id,
      ticketId: data.ticketId,
    })

    return comment
  }

  /**
   * Obtener estadísticas de tickets
   */
  static async getTicketStats(organizationId?: string): Promise<TicketStats> {
    const where: any = organizationId ? { organizationId } : {}

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      byPriority,
      resolvedTickets,
    ] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { ...where, status: 'open' } }),
      prisma.supportTicket.count({ where: { ...where, status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { ...where, status: 'resolved' } }),
      prisma.supportTicket.count({ where: { ...where, status: 'closed' } }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where,
        _count: {
          priority: true,
        },
      }),
      prisma.supportTicket.findMany({
        where: {
          ...where,
          status: { in: ['resolved', 'closed'] },
          resolvedAt: { not: null },
          firstResponseAt: { not: null },
        },
        select: {
          createdAt: true,
          firstResponseAt: true,
          resolvedAt: true,
        },
      }),
    ])

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }

    byPriority.forEach((item) => {
      priorityCounts[item.priority as TicketPriority] = item._count.priority
    })

    // Calcular tiempos promedio
    let averageResponseTime = 0
    let averageResolutionTime = 0

    if (resolvedTickets.length > 0) {
      const responseTimes = resolvedTickets
        .filter((t) => t.firstResponseAt)
        .map((t) => {
          const responseTime = t.firstResponseAt!
            ? (t.firstResponseAt.getTime() - new Date(t.createdAt || 0).getTime()) / (1000 * 60 * 60)
            : 0
          return responseTime
        })

      const resolutionTimes = resolvedTickets
        .filter((t) => t.resolvedAt && t.firstResponseAt)
        .map((t) => {
          const resolutionTime = t.resolvedAt && t.firstResponseAt
            ? (t.resolvedAt.getTime() - t.firstResponseAt.getTime()) / (1000 * 60 * 60)
            : 0
          return resolutionTime
        })

      averageResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      averageResolutionTime =
        resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      byPriority: priorityCounts,
      averageResponseTime,
      averageResolutionTime,
    }
  }

  /**
   * Obtener todos los administradores disponibles para asignar tickets
   */
  static async getAvailableAdmins() {
    return prisma.profile.findMany({
      where: {
        isActive: true,
        isSuperAdmin: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    })
  }
}
