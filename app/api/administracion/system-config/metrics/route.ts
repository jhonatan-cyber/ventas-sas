/**
 * GET /api/administracion/system-config/metrics
 * 
 * Obtiene métricas del sistema
 */

import { NextRequest, NextResponse } from 'next/server'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const [metrics, usageStats] = await Promise.all([
      SystemConfigService.getSystemMetrics(),
      SystemConfigService.getUsageStats(days)
    ])
    
    return NextResponse.json({
      success: true,
      metrics,
      usageStats
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
