/**
 * GET /api/administracion/monitoring/alerts
 * 
 * Obtiene alertas de seguridad del sistema
 */

import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SessionMonitoringService } from '@/lib/services/admin/session-monitoring-service'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const adminUser = await getCurrentAdminUser(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const severity = searchParams.get('severity') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined
    const type = searchParams.get('type') || undefined
    const resolved = searchParams.get('resolved') === 'true' ? true : 
                    searchParams.get('resolved') === 'false' ? false : undefined
    const organizationId = searchParams.get('organizationId') || undefined

    // Obtener alertas
    const result = await SessionMonitoringService.getSecurityAlerts(
      page,
      pageSize,
      {
        severity,
        type,
        resolved,
        organizationId
      }
    )

    logger.info('Alertas de seguridad consultadas por administrador', {
      adminUserId: adminUser.id,
      page,
      pageSize,
      total: result.total,
      filters: { severity, type, resolved, organizationId }
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('Error obteniendo alertas de seguridad', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}