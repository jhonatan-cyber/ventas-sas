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
    const days = parseInt(searchParams.get('days') || '30')

    const predictions = await AnalyticsService.getSalesPredictions(organizationId, days)

    return NextResponse.json({ success: true, data: predictions })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PREDICTIONS' }))
  }
}

