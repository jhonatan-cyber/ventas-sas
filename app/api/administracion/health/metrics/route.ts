import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { HealthMonitorService } from '@/lib/services/admin/health-monitor-service'

/**
 * GET /api/administracion/health/metrics
 * Obtener métricas de salud del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const metrics = await HealthMonitorService.getHealthMetrics()

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
