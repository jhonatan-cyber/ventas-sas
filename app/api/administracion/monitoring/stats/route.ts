/**
 * GET /api/administracion/monitoring/stats
 * 
 * Obtiene estadísticas generales del sistema para el dashboard
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

    // Obtener estadísticas del sistema
    const stats = await SessionMonitoringService.getSystemStats()

    logger.info('Estadísticas del sistema consultadas', {
      adminUserId: adminUser.id,
      stats: {
        totalActiveSessions: stats.totalActiveSessions,
        totalUsers: stats.totalUsers,
        totalOrganizations: stats.totalOrganizations
      }
    })

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error('Error obteniendo estadísticas del sistema', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}