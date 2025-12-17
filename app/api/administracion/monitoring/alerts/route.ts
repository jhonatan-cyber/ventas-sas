/**
 * GET /api/administracion/monitoring/alerts
 * 
 * Obtiene alertas de seguridad del sistema
 */

import { NextRequest, NextResponse } from 'next/server'

import { SessionMonitoringService } from '@/lib/services/admin/session-monitoring-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
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
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '20')
    const severity = searchParams.get("Severity") as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined
    const type = searchParams.get("Type") || undefined
    const resolved = searchParams.get("Resolved") === 'true' ? true : 
                    searchParams.get("Resolved") === 'false' ? false : undefined
    const organizationId = searchParams.get("Organization Id") || undefined

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