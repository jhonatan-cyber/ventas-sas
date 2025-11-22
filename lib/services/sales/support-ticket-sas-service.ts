import { prisma } from '@/lib/prisma'
import { AttachmentInput, SupportService, TicketCategory, TicketPriority, TicketStatus } from '@/lib/services/admin/support-service'

interface ListTicketsOptions {
  status?: TicketStatus | 'all'
  search?: string
  skip?: number
  take?: number
}

interface CreateSasTicketData {
  organizationId: string
  sasUserId: string
  title: string
  description: string
  priority?: TicketPriority
  category?: TicketCategory
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  attachments?: AttachmentInput[]
}

export class SupportTicketSasService {
  static async listTickets(
    organizationId: string,
    options: ListTicketsOptions = {}
  ) {
    const { status, search, skip = 0, take = 20 } = options

    const where: any = {
      organizationId,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        include: {
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
      }),
      prisma.supportTicket.count({ where }),
    ])

    return {
      tickets: tickets.map((ticket) => ({
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
        closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
        firstResponseAt: ticket.firstResponseAt ? ticket.firstResponseAt.toISOString() : null,
      })),
      total,
    }
  }

  static async getStats(organizationId: string) {
    const [open, inProgress, resolved, closed] = await Promise.all([
      prisma.supportTicket.count({ where: { organizationId, status: 'open' } }),
      prisma.supportTicket.count({ where: { organizationId, status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { organizationId, status: 'resolved' } }),
      prisma.supportTicket.count({ where: { organizationId, status: 'closed' } }),
    ])

    return {
      open,
      inProgress,
      resolved,
      closed,
    }
  }

  static async getTicketById(ticketId: string, organizationId: string) {
    const ticket = await (prisma as any).supportTicket.findFirst({
      where: {
        id: ticketId,
        organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
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
          },
        },
        comments: {
          where: {
            isInternal: false,
          },
          include: {
            attachments: {
              include: {
                uploadedBySas: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
                uploadedBy: {
                  select: {
                    id: true,
                    fullName: true,
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
            uploadedBySas: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!ticket) return null

    return {
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
      closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
      firstResponseAt: ticket.firstResponseAt ? ticket.firstResponseAt.toISOString() : null,
      comments: ticket.comments.map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        attachments: comment.attachments?.map((attachment: any) => ({
          ...attachment,
          createdAt: attachment.createdAt.toISOString(),
        })),
      })),
      attachments: ticket.attachments.map((attachment: any) => ({
        ...attachment,
        createdAt: attachment.createdAt.toISOString(),
      })),
      history: ticket.history.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    }
  }

  /**
   * Cerrar un ticket desde el portal SAS (cliente)
   */
  static async closeTicketForCustomer(ticketId: string, organizationId: string, sasUserId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        organizationId,
        createdBySasUserId: sasUserId,
      },
    })

    if (!ticket) {
      throw new Error('Ticket no encontrado o no pertenece al usuario actual')
    }

    if (ticket.status === 'closed') {
      return ticket
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'closed',
        closedAt: ticket.closedAt ?? new Date(),
      },
    })

    return updated
  }

  static async createTicket(data: CreateSasTicketData) {
    const attachments = data.attachments

    const ticket = await SupportService.createTicket({
      organizationId: data.organizationId,
      createdBySasUserId: data.sasUserId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category || 'other',
      contactName: data.contactName || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
    })

    if (attachments && attachments.length > 0) {
      await SupportService.addAttachmentsToTicket(ticket.id, attachments)
    }

    return ticket
  }

  static async addComment({
    ticketId,
    authorId,
    content,
    attachments,
  }: {
    ticketId: string
    authorId: string
    content: string
    attachments?: AttachmentInput[]
  }) {
    return SupportService.addComment({
      ticketId,
      authorId,
      authorType: 'organization',
      content,
      attachments,
    })
  }
}

