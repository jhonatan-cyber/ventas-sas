/**
 * GET /api/administracion/system-config/logs
 * 
 * Obtiene logs de seguridad del sistema con filtros
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || undefined
    const userId = searchParams.get('userId') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const success = searchParams.get('success') ? searchParams.get('success') === 'true' : undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const result = await SystemConfigService.getSecurityLogs(limit, offset, {
      type,
      userId,
      customerId,
      success,
      startDate,
      endDate
    })
    
    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
