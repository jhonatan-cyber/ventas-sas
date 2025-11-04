import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export interface FeedbackData {
  organizationId?: string
  userId?: string
  userType?: string
  category: string
  title: string
  description: string
  priority?: string
}

export interface FeedbackFilters {
  category?: string
  status?: string
  priority?: string
  organizationId?: string
  page?: number
  pageSize?: number
}

export class FeedbackService {
  static async getFeedbacks(filters: FeedbackFilters = {}) {
    if (!prisma || !(prisma as any).userFeedback) {
      return { feedbacks: [], total: 0, page: 1, pageSize: 20 }
    }

    try {
      const where: any = {}
      if (filters.category) where.category = filters.category
      if (filters.status) where.status = filters.status
      if (filters.priority) where.priority = filters.priority
      if (filters.organizationId) where.organizationId = filters.organizationId

      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const skip = (page - 1) * pageSize

      const [feedbacks, total] = await Promise.all([
        (prisma as any).userFeedback.findMany({
          where,
          include: {
            organization: { select: { id: true, name: true, slug: true } },
            feedbackVotes: true,
            _count: { select: { feedbackVotes: true } },
          },
          orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: pageSize,
        }),
        (prisma as any).userFeedback.count({ where }),
      ])

      return { feedbacks, total, page, pageSize }
    } catch (error: any) {
      // Si la tabla no existe, retornar valores por defecto
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.warn('UserFeedback table does not exist. Please run: pnpm db:push')
        return { feedbacks: [], total: 0, page: 1, pageSize: 20 }
      }
      throw error
    }
  }

  static async getFeedbackById(id: string) {
    if (!prisma || !(prisma as any).userFeedback) {
      return null
    }

    try {
      return await (prisma as any).userFeedback.findUnique({
        where: { id },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          feedbackVotes: true,
          _count: { select: { feedbackVotes: true } },
        },
      })
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.warn('UserFeedback table does not exist. Please run: pnpm db:push')
        return null
      }
      throw error
    }
  }

  static async createFeedback(data: FeedbackData) {
    if (!prisma || !(prisma as any).userFeedback) {
      throw new Error('UserFeedback model not found. Please run: pnpm db:generate')
    }

    const feedback = await (prisma as any).userFeedback.create({
      data: {
        ...data,
        status: 'open',
        priority: data.priority || 'medium',
        userType: data.userType || 'admin',
        votes: 0,
      },
    })

    logBusinessOperation('CREATE', 'UserFeedback', feedback.id, undefined, { category: feedback.category })
    return feedback
  }

  static async updateFeedback(id: string, data: { status?: string; priority?: string; adminNotes?: string; completedBy?: string }) {
    if (!prisma || !(prisma as any).userFeedback) {
      throw new Error('UserFeedback model not found. Please run: pnpm db:generate')
    }

    const updateData: any = { ...data }
    if (data.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const feedback = await (prisma as any).userFeedback.update({
      where: { id },
      data: updateData,
    })

    logBusinessOperation('UPDATE', 'UserFeedback', id, undefined, { status: feedback.status })
    return feedback
  }

  static async voteFeedback(feedbackId: string, userId: string, userType: string) {
    if (!prisma || !(prisma as any).feedbackVote) {
      throw new Error('FeedbackVote model not found. Please run: pnpm db:generate')
    }

    // Verificar si ya votó
    const existingVote = await (prisma as any).feedbackVote.findUnique({
      where: {
        feedbackId_userId_userType: {
          feedbackId,
          userId,
          userType,
        },
      },
    })

    if (existingVote) {
      // Remover voto
      await (prisma as any).feedbackVote.delete({
        where: { id: existingVote.id },
      })
      await (prisma as any).userFeedback.update({
        where: { id: feedbackId },
        data: { votes: { decrement: 1 } },
      })
      return { voted: false, votes: await this.getFeedbackVotes(feedbackId) }
    } else {
      // Agregar voto
      await (prisma as any).feedbackVote.create({
        data: { feedbackId, userId, userType },
      })
      await (prisma as any).userFeedback.update({
        where: { id: feedbackId },
        data: { votes: { increment: 1 } },
      })
      return { voted: true, votes: await this.getFeedbackVotes(feedbackId) }
    }
  }

  static async getFeedbackVotes(feedbackId: string) {
    if (!prisma || !(prisma as any).userFeedback) {
      return 0
    }

    const feedback = await (prisma as any).userFeedback.findUnique({
      where: { id: feedbackId },
      select: { votes: true },
    })

    return feedback?.votes || 0
  }

  static async getFeedbackStats() {
    if (!prisma || !(prisma as any).userFeedback) {
      return {
        total: 0,
        byCategory: {},
        byStatus: {},
        topVoted: [],
      }
    }

    try {
      const feedbacks = await (prisma as any).userFeedback.findMany({
        select: {
          category: true,
          status: true,
          votes: true,
          title: true,
          id: true,
        },
      })

      const byCategory: Record<string, number> = {}
      const byStatus: Record<string, number> = {}

      feedbacks.forEach((f: any) => {
        byCategory[f.category] = (byCategory[f.category] || 0) + 1
        byStatus[f.status] = (byStatus[f.status] || 0) + 1
      })

      const topVoted = feedbacks
        .sort((a: any, b: any) => b.votes - a.votes)
        .slice(0, 10)
        .map((f: any) => ({ id: f.id, title: f.title, votes: f.votes }))

      return {
        total: feedbacks.length,
        byCategory,
        byStatus,
        topVoted,
      }
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.warn('UserFeedback table does not exist. Please run: pnpm db:push')
        return {
          total: 0,
          byCategory: {},
          byStatus: {},
          topVoted: [],
        }
      }
      throw error
    }
  }
}
