/**
 * API endpoint para descargar plantillas de importación
 */

import { readFile, unlink } from 'fs/promises'

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { ExportService, ExportFormat, ExportEntity } from '@/lib/services/sales/export-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const entity = searchParams.get('entity') as ExportEntity
    const format = (searchParams.get('format') || 'excel') as ExportFormat

    if (!entity) {
      throw AppError.validation('Entity es requerido')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    // Generar plantilla (en memoria)
    const result = await ExportService.generateImportTemplate(entity, format)

    if (!result.success || (!result.fileBuffer && !result.filePath)) {
      return NextResponse.json(
        { error: result.error || 'Error al generar plantilla' },
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
    return handleApiError(error, createErrorContext(request, { action: 'DOWNLOAD_TEMPLATE' }))
  }
}

