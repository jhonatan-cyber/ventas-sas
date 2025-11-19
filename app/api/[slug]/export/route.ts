/**
 * API endpoint para exportación de datos
 */

import { readFile, unlink } from 'fs/promises'

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { ExportService, ExportFormat, ExportEntity } from '@/lib/services/sales/export-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const { entity, format, filters } = body as {
      entity: ExportEntity
      format: ExportFormat
      filters?: {
        branchId?: string
        categoryId?: string
        status?: string
        startDate?: string
        endDate?: string
      }
    }

    if (!entity || !format) {
      throw AppError.validation('Entity y format son requeridos')
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    // Verificar si el usuario es administrador para filtros de sucursal
    const userRoleName = currentUser?.rol?.nombre?.toLowerCase() || ''
    const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'

    // Si no es admin, filtrar por su sucursal
    const effectiveFilters = {
      ...filters,
      branchId: isAdmin ? filters?.branchId : currentUser?.sucursalId || undefined,
    }

    // Ejecutar exportación
    let result
    if (entity === 'products') {
      result = await ExportService.exportProducts({
        organizationId,
        entity: 'products',
        format,
        filters: effectiveFilters ? {
          branchId: effectiveFilters.branchId,
          categoryId: effectiveFilters.categoryId,
          status: effectiveFilters.status,
          startDate: effectiveFilters.startDate ? new Date(effectiveFilters.startDate) : undefined,
          endDate: effectiveFilters.endDate ? new Date(effectiveFilters.endDate) : undefined,
        } : undefined,
      })
    } else if (entity === 'customers') {
      result = await ExportService.exportCustomers({
        organizationId,
        entity: 'customers',
        format,
        filters: effectiveFilters ? {
          status: effectiveFilters.status,
        } : undefined,
      })
    } else if (entity === 'sales') {
      result = await ExportService.exportSales({
        organizationId,
        entity: 'sales',
        format,
        filters: effectiveFilters ? {
          startDate: effectiveFilters.startDate ? new Date(effectiveFilters.startDate) : undefined,
          endDate: effectiveFilters.endDate ? new Date(effectiveFilters.endDate) : undefined,
        } : undefined,
      })
    } else {
      throw AppError.validation(`Entity "${entity}" no soportado`)
    }

    if (!result.success || (!result.fileBuffer && !result.filePath)) {
      return NextResponse.json(
        { error: result.error || 'Error al exportar' },
        { status: 500 }
      )
    }

    // Obtener buffer (preferir memoria)
    const fileBuffer = result.fileBuffer
      ? result.fileBuffer
      : await readFile(result.filePath!)

    // Si hubo archivo temporal, intentar eliminarlo
    if (result.filePath) {
      try { await unlink(result.filePath) } catch {}
    }

    const mimeType = format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'EXPORT_DATA' }))
  }
}

