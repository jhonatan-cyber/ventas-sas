import { NextRequest, NextResponse } from 'next/server'

import { DashboardService } from '@/lib/services/admin/dashboard-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/dashboard/health
 * Obtener métricas de salud del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const health = await DashboardService.getHealthMetrics()

    return NextResponse.json({
      success: true,
      health,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
