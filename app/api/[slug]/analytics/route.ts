import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/sales/analytics-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'sales'
    const period = (searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'daily'
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    let data

    switch (type) {
      case 'sales':
        data = await AnalyticsService.getSalesTimeSeries(organizationId, period, days)
        break
      case 'products':
        data = await AnalyticsService.getTopProducts(organizationId, limit)
        break
      case 'quotations':
        data = await AnalyticsService.getQuotationAnalytics(organizationId, days)
        break
      case 'revenue':
        data = await AnalyticsService.getRevenueAnalytics(organizationId, days)
        break
      case 'comparison':
        data = await AnalyticsService.getPeriodComparison(organizationId, days)
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de analytics no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

