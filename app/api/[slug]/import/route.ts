/**
 * API endpoint para importación de datos
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

import { AppError } from '@/lib/errors/app-error'
import { ImportService, ImportFormat, ImportEntity } from '@/lib/services/sales/import-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { getRequestContext } from '@/lib/utils/request-context'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let tempFilePath: string | null = null

  try {
    const { slug } = await params
    const formData = await request.formData()

    const file = formData.get('file') as File
    const entity = formData.get('entity') as ImportEntity
    const updateExisting = formData.get('updateExisting') === 'true'
    const skipErrors = formData.get('skipErrors') === 'true'
    const selectedBranchId = (formData.get('selectedBranchId') as string | null) || null
    const selectedCategoryId = (formData.get('selectedCategoryId') as string | null) || null

    if (!file) {
      throw AppError.validation('Archivo es requerido')
    }

    if (!entity) {
      throw AppError.validation('Entity es requerido')
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
    const isAdmin =
      (currentUser.rol?.nombre || '').toLowerCase().includes('admin') ||
      (currentUser.rol?.nombre || '').toLowerCase() === 'administrador'
    const userBranchId: string | null =
      (currentUser.sucursalId as string | null) ||
      (currentUser.sucursal?.id as string | null) ||
      null

    // Determinar formato del archivo
    const fileName = file.name.toLowerCase()
    let format: ImportFormat
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      format = 'excel'
    } else if (fileName.endsWith('.csv')) {
      format = 'csv'
    } else {
      throw AppError.validation('Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)')
    }

    // Crear directorio temporal si no existe
    const tempDir = join(process.cwd(), 'temp')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    // Guardar archivo temporalmente
    const timestamp = Date.now()
    tempFilePath = join(tempDir, `import_${timestamp}_${file.name}`)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(tempFilePath, buffer)

    // Ejecutar importación
    let result
    if (entity === 'products') {
      result = await ImportService.importProducts({
        organizationId,
        entity: 'products',
        format,
        filePath: tempFilePath,
        updateExisting,
        skipErrors,
        defaultBranchId: isAdmin ? (selectedBranchId || undefined) : (userBranchId || undefined),
        defaultCategoryId: selectedCategoryId || undefined,
      })
    } else {
      throw AppError.validation(`Entity "${entity}" no soportado aún`)
    }

    // Eliminar archivo temporal
    try {
      if (tempFilePath) {
        await unlink(tempFilePath)
      }
    } catch (error) {
      // Ignorar error si no se puede eliminar
    }

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      message: result.success
        ? `Importación completada: ${result.imported} creados, ${result.updated} actualizados, ${result.skipped} omitidos`
        : `Importación con errores: ${result.errors.length} error(es) encontrado(s)`,
    })
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch {
        // Ignorar error
      }
    }

    return handleApiError(error, createErrorContext(request, { action: 'IMPORT_DATA' }))
  }
}

