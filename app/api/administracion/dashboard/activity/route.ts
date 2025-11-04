import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/admin/dashboard-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * GET /api/administracion/dashboard/activity
 * Obtener actividad reciente con filtro de período
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')
    const limitParam = searchParams.get('limit')

    const period = (['7d', '30d', '90d', '1y', 'all'].includes(periodParam || '')
      ? periodParam
      : '30d') as '7d' | '30d' | '90d' | '1y' | 'all'

    const limit = limitParam ? parseInt(limitParam) : 20

    const activity = await DashboardService.getRecentActivity(period, limit)

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
