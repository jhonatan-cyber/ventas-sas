import { NextRequest, NextResponse } from 'next/server'

import { AnalyticsService } from '@/lib/services/analytics/analytics-service'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

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
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const dateRange = start && end
      ? { start: new Date(start), end: new Date(end) }
      : undefined

    const kpis = await AnalyticsService.getKPIs(organizationId, dateRange)

    return NextResponse.json({ success: true, data: kpis })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_KPIS' }))
  }
}

