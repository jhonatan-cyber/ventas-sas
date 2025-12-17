import { NextRequest, NextResponse } from 'next/server'

import { SecurityLogsService, SecurityLogFilters } from '@/lib/services/admin/security-logs-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
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
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '50')
    const skip = (page - 1) * pageSize

    // Filtros
    const filters: SecurityLogFilters = {}

    const typeParam = searchParams.get("Type")
    if (typeParam) {
      if (typeParam.includes(',')) {
        filters.type = typeParam.split(",") as SecurityLogType[]
      } else {
        filters.type = typeParam as SecurityLogType
      }
    }

    const userId = searchParams.get("User Id")
    if (userId) {
      filters.userId = userId
    }

    const organizationId = searchParams.get("Organization Id")
    if (organizationId) {
      filters.organizationId = organizationId
    }

    const customerId = searchParams.get("Customer Id")
    if (customerId) {
      filters.customerId = customerId
    }

    const ipAddress = searchParams.get("Ip Address")
    if (ipAddress) {
      filters.ipAddress = ipAddress
    }

    const successParam = searchParams.get("Success")
    if (successParam !== null && successParam !== '') {
      filters.success = successParam === 'true'
    }

    const startDate = searchParams.get("Start Date")
    if (startDate) {
      filters.startDate = new Date(startDate)
    }

    const endDate = searchParams.get("End Date")
    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    const search = searchParams.get("Search")
    if (search) {
      filters.search = search
    }

    // Obtener logs
    const { logs, total } = await SecurityLogsService.getSecurityLogs(filters, skip, pageSize)

    // Obtener estadísticas si se solicita
    const includeStats = searchParams.get("Include Stats") === 'true'
    let stats = null
    if (includeStats) {
      const days = parseInt(searchParams.get("Stats Days") || '30')
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


