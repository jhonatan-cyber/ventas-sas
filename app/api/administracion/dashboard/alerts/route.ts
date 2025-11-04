import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/admin/dashboard-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * GET /api/administracion/dashboard/alerts
 * Obtener alertas destacadas del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const alerts = await DashboardService.getAlerts()

    return NextResponse.json({
      success: true,
      alerts,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
