import { NextRequest, NextResponse } from 'next/server'
import { SecurityLogsService, SecurityLogFilters } from '@/lib/services/admin/security-logs-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { SecurityLogType } from '@/lib/utils/security-audit'

/**
 * GET /api/administracion/logs
 * Obtener logs de seguridad con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Paginación
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const skip = (page - 1) * pageSize

    // Filtros
    const filters: SecurityLogFilters = {}

    const typeParam = searchParams.get('type')
    if (typeParam) {
      if (typeParam.includes(',')) {
        filters.type = typeParam.split(',') as SecurityLogType[]
      } else {
        filters.type = typeParam as SecurityLogType
      }
    }

    const userId = searchParams.get('userId')
    if (userId) {
      filters.userId = userId
    }

    const organizationId = searchParams.get('organizationId')
    if (organizationId) {
      filters.organizationId = organizationId
    }

    const customerId = searchParams.get('customerId')
    if (customerId) {
      filters.customerId = customerId
    }

    const ipAddress = searchParams.get('ipAddress')
    if (ipAddress) {
      filters.ipAddress = ipAddress
    }

    const successParam = searchParams.get('success')
    if (successParam !== null && successParam !== '') {
      filters.success = successParam === 'true'
    }

    const startDate = searchParams.get('startDate')
    if (startDate) {
      filters.startDate = new Date(startDate)
    }

    const endDate = searchParams.get('endDate')
    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    // Obtener logs
    const { logs, total } = await SecurityLogsService.getSecurityLogs(filters, skip, pageSize)

    // Obtener estadísticas si se solicita
    const includeStats = searchParams.get('includeStats') === 'true'
    let stats = null
    if (includeStats) {
      const days = parseInt(searchParams.get('statsDays') || '30')
      stats = await SecurityLogsService.getSecurityLogStats(filters, days)
    }

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}


