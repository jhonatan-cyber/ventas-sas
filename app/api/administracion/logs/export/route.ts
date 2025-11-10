import { NextRequest, NextResponse } from 'next/server'

import { SecurityLogsService, SecurityLogFilters } from '@/lib/services/admin/security-logs-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * POST /api/administracion/logs/export
 * Exportar logs en formato CSV o JSON
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { format = 'csv', filters = {} } = body

    // Construir filtros desde el body
    const securityFilters: SecurityLogFilters = {}

    if (filters.type) {
      securityFilters.type = filters.type
    }
    if (filters.userId) {
      securityFilters.userId = filters.userId
    }
    if (filters.organizationId) {
      securityFilters.organizationId = filters.organizationId
    }
    if (filters.customerId) {
      securityFilters.customerId = filters.customerId
    }
    if (filters.ipAddress) {
      securityFilters.ipAddress = filters.ipAddress
    }
    if (filters.success !== undefined) {
      securityFilters.success = filters.success
    }
    if (filters.startDate) {
      securityFilters.startDate = new Date(filters.startDate)
    }
    if (filters.endDate) {
      securityFilters.endDate = new Date(filters.endDate)
    }
    if (filters.search) {
      securityFilters.search = filters.search
    }

    if (format === 'csv') {
      const csv = await SecurityLogsService.exportLogsToCSV(securityFilters)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else if (format === 'json') {
      const json = await SecurityLogsService.exportLogsToJSON(securityFilters)
      return NextResponse.json({
        success: true,
        logs: json,
        exportedAt: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({ error: 'Formato no válido. Use "csv" o "json"' }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
