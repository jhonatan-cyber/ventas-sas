import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import { logDatabase, logBusinessOperation } from '@/lib/utils/logger'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'billing' | 'technical' | 'other'

export interface CreateTicketData {
  organizationId: string
  createdById?: string
  createdByCustomerId?: string
  createdBySasUserId?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  title: string
  description: string
  priority?: TicketPriority
  category?: TicketCategory
  attachments?: AttachmentInput[]
}

export interface UpdateTicketData {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  assignedToId?: string | null
}

export interface AttachmentInput {
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  commentId?: string | null
  uploadedById?: string | null
  uploadedBySasUserId?: string | null
}

export interface CreateCommentData {
  ticketId: string
  authorId: string
  authorType: 'admin' | 'organization' | 'system'
  content: string
  isInternal?: boolean
  attachments?: AttachmentInput[]
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

    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await (tx as any).supportTicket.create({
      data: {
        ticketNumber,
        organizationId: data.organizationId,
        createdById: data.createdById || null,
        createdByCustomerId: data.createdByCustomerId || null,
        createdBySasUserId: data.createdBySasUserId || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        title: data.title,
        description: data.description,
        status: 'open',
        priority: data.priority || 'medium',
        category: data.category || 'other',
      },
      include: {
        organization: true,
        createdBy: true,
        createdByCustomer: true,
        createdBySasUser: true,
        assignedTo: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      })

      if (data.attachments && data.attachments.length > 0) {
        await tx.ticketAttachment.createMany({
          data: data.attachments.map((attachment) =>
            SupportService.mapAttachmentInput(newTicket.id, attachment),
          ),
        })
      }

      return newTicket
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
   * Agregar adjuntos directamente al ticket (sin comentario)
   */
  static async addAttachmentsToTicket(
    ticketId: string,
    attachments: AttachmentInput[],
  ): Promise<void> {
    if (!attachments || attachments.length === 0) return

    await prisma.ticketAttachment.createMany({
      data: attachments.map((attachment) =>
        SupportService.mapAttachmentInput(ticketId, attachment),
      ),
    })
  }

  private static mapAttachmentInput(
    ticketId: string,
    attachment: AttachmentInput,
    commentIdOverride?: string,
  ): Prisma.TicketAttachmentCreateManyInput {
    return {
      ticketId,
      uploadedById: (attachment.uploadedById || null) as any,
      // @ts-ignore
      uploadedBySasUserId: (attachment.uploadedBySasUserId || null) as any,
      commentId: commentIdOverride ?? attachment.commentId ?? null,
      fileName: attachment.fileName,
      filePath: attachment.filePath,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    } as any
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
        createdBySasUser: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            phone: true,
            foto: true,
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
    const ticket = await (prisma as any).supportTicket.findUnique({
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
        createdByCustomer: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        createdBySasUser: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            phone: true,
            foto: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            photo: true,
          },
        },
        comments: {
          include: {
            attachments: {
              include: {
                uploadedBy: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
                uploadedBySas: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
              },
            },
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
                email: true,
              },
            },
            uploadedBySas: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
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

    // Enriquecer comentarios con información del autor
    if (ticket && ticket.comments && Array.isArray(ticket.comments)) {
      const enrichedComments = await Promise.all(
        ticket.comments.map(async (comment: any) => {
          let authorInfo: any = null

          if (comment.authorType === 'admin' && comment.authorId) {
            const admin = await prisma.profile.findUnique({
              where: { id: comment.authorId },
              select: {
                id: true,
                fullName: true,
                email: true,
                photo: true,
              },
            })
            if (admin) {
              authorInfo = {
                id: admin.id,
                fullName: admin.fullName,
                email: admin.email,
                photo: admin.photo,
              }
            }
          } else if ((comment.authorType === 'organization' || comment.authorType === 'customer') && comment.authorId) {
            const usuarioSas = await prisma.usuarioSas.findUnique({
              where: { id: comment.authorId },
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                foto: true,
              },
            })
            if (usuarioSas) {
              authorInfo = {
                id: usuarioSas.id,
                nombre: usuarioSas.nombre,
                apellido: usuarioSas.apellido,
                email: usuarioSas.email,
                foto: usuarioSas.foto,
              }
            }
          }

          return {
            ...comment,
            author: authorInfo,
          }
        })
      )

      ticket.comments = enrichedComments
    }

    return ticket
  }

  /**
   * Actualizar ticket
   */
  static async updateTicket(id: string, data: UpdateTicketData, changedById?: string) {
    const startTime = Date.now()
    
    const existingTicket = await (prisma as any).supportTicket.findUnique({
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
      const updatedTicket = await (tx as any).supportTicket.update({
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
        createdByCustomer: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        createdBySasUser: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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

      // Actualizar firstResponseAt y estado si es necesario
      if (isFirstAdminResponse) {
        await tx.supportTicket.update({
          where: { id: data.ticketId },
          data: {
            firstResponseAt: new Date(),
            // Si el ticket está abierto, al primer comentario de admin pasa a "in_progress"
            status: ticket.status === 'open' ? 'in_progress' : ticket.status,
          },
        })
      }

      if (data.attachments && data.attachments.length > 0) {
        await tx.ticketAttachment.createMany({
          data: data.attachments.map((attachment) =>
            SupportService.mapAttachmentInput(
              data.ticketId,
              attachment,
              attachment.commentId ?? newComment.id,
            ),
          ),
        })
      }

      // Registrar en historial
      await tx.ticketHistory.create({
        data: {
          ticketId: data.ticketId,
          changedById: data.authorType === 'admin' ? data.authorId : null,
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
  static async getTicketStats(organizationId?: string, assignedToId?: string): Promise<TicketStats> {
    const where: any = {}
    
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId
    }

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

  /**
   * Cerrar automáticamente tickets inactivos por más de 24 horas
   */
  static async closeInactiveTickets() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Obtener tickets que no están cerrados y tienen más de 24 horas sin actividad
    const tickets = await prisma.supportTicket.findMany({
      where: {
        status: {
          not: 'closed',
        },
        closedAt: null,
      },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const ticketsToClose: string[] = []

    for (const ticket of tickets) {
      // Determinar la última fecha de actividad
      let lastActivityDate: Date

      if (ticket.comments && ticket.comments.length > 0) {
        // Si hay comentarios, usar la fecha del último comentario
        lastActivityDate = ticket.comments[0].createdAt
      } else {
        // Si no hay comentarios, usar la fecha de creación del ticket
        lastActivityDate = ticket.createdAt
      }

      // Si la última actividad fue hace más de 24 horas, cerrar el ticket
      if (lastActivityDate < twentyFourHoursAgo) {
        ticketsToClose.push(ticket.id)
      }
    }

    if (ticketsToClose.length === 0) {
      return { closed: 0, message: 'No hay tickets inactivos para cerrar' }
    }

    // Cerrar los tickets y registrar en historial
    const now = new Date()
    let closedCount = 0

    for (const ticketId of ticketsToClose) {
      await prisma.$transaction(async (tx) => {
        // Cerrar el ticket
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'closed',
            closedAt: now,
          },
        })

        // Registrar en historial
        await tx.ticketHistory.create({
          data: {
            ticketId,
            changedById: null, // Cambio automático del sistema
            changeType: 'status_changed',
            oldValue: 'open',
            newValue: 'closed',
            description: 'Ticket cerrado automáticamente por inactividad (más de 24 horas sin respuesta)',
          },
        })
      })
      closedCount++
    }

    return {
      closed: closedCount,
      message: `Se cerraron ${closedCount} ticket(s) inactivos`,
    }
  }
}
