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
    const limit = parseInt(searchParams.get("Limit") || '50')
    const offset = parseInt(searchParams.get("Offset") || '0')
    const type = searchParams.get("Type") || undefined
    const userId = searchParams.get("User Id") || undefined
    const customerId = searchParams.get("Customer Id") || undefined
    const success = searchParams.get("Success") ? searchParams.get("Success") === 'true' : undefined
    const startDate = searchParams.get("Start Date") ? new Date(searchParams.get("Start Date")!) : undefined
    const endDate = searchParams.get("End Date") ? new Date(searchParams.get("End Date")!) : undefined

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
