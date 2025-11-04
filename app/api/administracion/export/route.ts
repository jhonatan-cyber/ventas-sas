import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { DataExportService, ExportOptions } from '@/lib/services/admin/data-export-service'
import { z } from 'zod'

const exportSchema = z.object({
  type: z.enum(['organizations', 'users', 'subscriptions', 'tickets', 'billing']),
  format: z.enum(['csv', 'excel', 'json']),
  filters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.string().optional(),
    organizationId: z.string().optional(),
  }).optional(),
})

/**
 * POST /api/administracion/export
 * Exportar datos masivamente
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validated = exportSchema.parse(body)

    const options: ExportOptions = {
      type: validated.type,
      format: validated.format,
      filters: validated.filters ? {
        dateFrom: validated.filters.dateFrom ? new Date(validated.filters.dateFrom) : undefined,
        dateTo: validated.filters.dateTo ? new Date(validated.filters.dateTo) : undefined,
        status: validated.filters.status,
        organizationId: validated.filters.organizationId,
      } : undefined,
    }

    const result = await DataExportService.export(options)

    // Retornar archivo para descarga
    return new NextResponse(result.content, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="export_${validated.type}_${Date.now()}.${result.extension}"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return handleApiError(error, createErrorContext(request))
  }
}
