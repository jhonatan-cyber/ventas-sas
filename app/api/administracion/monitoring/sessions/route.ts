/**
 * GET /api/administracion/monitoring/sessions
 * 
 * Obtiene todas las sesiones activas del sistema para monitoreo
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
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const organizationId = searchParams.get('organizationId') || undefined
    const userId = searchParams.get('userId') || undefined
    const riskLevel = searchParams.get('riskLevel') as 'LOW' | 'MEDIUM' | 'HIGH' | undefined
    const deviceType = searchParams.get('deviceType') || undefined
    const ipAddress = searchParams.get('ipAddress') || undefined

    // Obtener sesiones
    const result = await SessionMonitoringService.getAllActiveSessions(
      page,
      pageSize,
      {
        organizationId,
        userId,
        riskLevel,
        deviceType,
        ipAddress
      }
    )

    logger.info('Sesiones consultadas por administrador', {
      adminUserId: adminUser.id,
      page,
      pageSize,
      total: result.total,
      filters: { organizationId, userId, riskLevel, deviceType, ipAddress }
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('Error obteniendo sesiones para monitoreo', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/administracion/monitoring/sessions
 * 
 * Invalida sesiones específicas
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const adminUser = await getCurrentAdminUser(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionIds, reason } = body

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de sesión requeridos' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Razón de invalidación requerida' },
        { status: 400 }
      )
    }

    // Invalidar sesiones
    const results = await Promise.all(
      sessionIds.map(sessionId => 
        SessionMonitoringService.invalidateSession(
          sessionId,
          adminUser.id,
          reason.trim()
        )
      )
    )

    const successCount = results.filter(Boolean).length

    logger.security('Sesiones invalidadas por administrador', {
      adminUserId: adminUser.id,
      sessionIds,
      reason: reason.trim(),
      successCount,
      totalRequested: sessionIds.length
    })

    return NextResponse.json({
      success: true,
      message: `${successCount} de ${sessionIds.length} sesiones invalidadas correctamente`,
      invalidated: successCount
    })

  } catch (error) {
    logger.error('Error invalidando sesiones', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}