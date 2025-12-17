/**
 * GET /api/administracion/monitoring/organizations/[id]/metrics
 * 
 * Obtiene métricas detalladas de una organización específica
 */

import { NextRequest, NextResponse } from 'next/server'

import { SessionMonitoringService } from '@/lib/services/admin/session-monitoring-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación de administrador
    const adminUser = await getCurrentAdminUser(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const organizationId = resolvedParams.id

    if (!organizationId) {
      return NextResponse.json(
        { error: 'ID de organización requerido' },
        { status: 400 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("Days") || '30')

    // Obtener métricas de la organización
    const metrics = await SessionMonitoringService.getOrganizationMetrics(
      organizationId,
      days
    )

    logger.info('Métricas de organización consultadas', {
      adminUserId: adminUser.id,
      organizationId,
      days,
      metrics: {
        totalSessions: metrics.totalSessions,
        activeSessions: metrics.activeSessions,
        uniqueUsers: metrics.uniqueUsers
      }
    })

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    logger.error('Error obteniendo métricas de organización', error as Error, {
      organizationId: (await params).id
    })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}