import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/dashboard/recent-subscriptions
 * Obtener suscripciones recientes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      subscriptions,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
