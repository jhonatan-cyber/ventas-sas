import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface AbTestData {
  name: string
  description?: string
  testType: 'subscription_plan' | 'pricing' | 'feature'
  organizationId?: string
  startDate?: Date
  endDate?: Date
  targetAudience?: any
  successMetrics: any
}

export interface AbTestVariantData {
  name: string
  description?: string
  variantData: any
  trafficPercentage: number
  isControl?: boolean
}

export interface AbTestFilters {
  testType?: string
  status?: string
  organizationId?: string
}

export class AbTestService {
  static async createTest(data: AbTestData, createdById: string) {
    if (!prisma || !(prisma as any).abTest) {
      throw new Error('Prisma Client no tiene el modelo AbTest. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).abTest.create({
      data: {
        ...data,
        createdById,
        status: 'draft',
      },
      include: {
        variants: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
  }

  static async getTests(filters: AbTestFilters = {}) {
    if (!prisma || !(prisma as any).abTest) {
      return { tests: [], total: 0 }
    }

    const where: Prisma.AbTestWhereInput = {}

    if (filters.testType) {
      where.testType = filters.testType
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    const [tests, total] = await Promise.all([
      (prisma as any).abTest.findMany({
        where,
        include: {
          variants: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              participants: true,
              events: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      (prisma as any).abTest.count({ where }),
    ])

    return { tests, total }
  }

  static async getTestById(id: string) {
    if (!prisma || !(prisma as any).abTest) {
      return null
    }

    return (prisma as any).abTest.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                participants: true,
              },
            },
          },
        },
        participants: {
          include: {
            variant: true,
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
  }

  static async addVariant(testId: string, variantData: AbTestVariantData) {
    if (!prisma || !(prisma as any).abTestVariant) {
      throw new Error('Prisma Client no tiene el modelo AbTestVariant. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).abTestVariant.create({
      data: {
        ...variantData,
        abTestId: testId,
      },
    })
  }

  static async startTest(id: string) {
    if (!prisma || !(prisma as any).abTest) {
      throw new Error('Prisma Client no tiene el modelo AbTest. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).abTest.update({
      where: { id },
      data: {
        status: 'running',
        startDate: new Date(),
      },
    })
  }

  static async getTestStats(id: string) {
    if (!prisma || !(prisma as any).abTest) {
      return null
    }

    const test = await (prisma as any).abTest.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                participants: true,
              },
            },
          },
        },
        participants: true,
        events: true,
      },
    })

    if (!test) return null

    const stats = {
      totalParticipants: test.participants.length,
      totalEvents: test.events.length,
      conversions: test.participants.filter((p: any) => p.converted).length,
      variantStats: test.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        participants: variant._count.participants,
        conversions: test.participants.filter(
          (p: any) => p.variantId === variant.id && p.converted
        ).length,
        conversionRate:
          variant._count.participants > 0
            ? (test.participants.filter(
                (p: any) => p.variantId === variant.id && p.converted
              ).length /
                variant._count.participants) *
              100
            : 0,
      })),
    }

    return stats
  }
}

