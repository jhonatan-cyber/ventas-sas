import { NextRequest, NextResponse } from 'next/server'

import { AnalyticsService } from '@/lib/services/analytics/analytics-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const user = await getCurrentSasUser(request, slug)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Soportar tanto el rango de fechas como el número de días
    const startParam = searchParams.get("Start")
    const endParam = searchParams.get("End")
    const daysParam = searchParams.get("Days")
    const groupBy = (searchParams.get("Group By") || 'day') as 'day' | 'week' | 'month'

    let dateRange: { start: Date; end: Date } | undefined
    let days = 30

    if (startParam && endParam) {
      // Usar rango de fechas si está disponible
      dateRange = {
        start: new Date(startParam),
        end: new Date(endParam)
      }
      // Calcular días entre las fechas
      days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    } else if (daysParam) {
      days = parseInt(daysParam)
    }

    const trends = await AnalyticsService.getSalesTrends(organizationId, days, groupBy, dateRange)

    return NextResponse.json({ success: true, data: trends })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_TRENDS' }))
  }
}

