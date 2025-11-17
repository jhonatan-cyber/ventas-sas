/**
 * API endpoint para descargar un backup específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

import { AppError } from '@/lib/errors/app-error'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; fileName: string }> }
) {
  try {
    const { slug, fileName } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    // Verificar que el usuario sea administrador
    const userRoleName = currentUser?.rol?.nombre?.toLowerCase() || ''
    const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'
    
    if (!isAdmin) {
      throw AppError.forbidden('Solo los administradores pueden descargar backups')
    }

    // Validar nombre de archivo (prevenir path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw AppError.validation('Nombre de archivo inválido')
    }

    // Construir ruta del backup
    const backupPath = join(process.cwd(), 'backups', organizationId, fileName)

    if (!existsSync(backupPath)) {
      throw AppError.notFound('Backup no encontrado')
    }

    // Leer y enviar archivo
    const fileBuffer = await readFile(backupPath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DOWNLOAD_BACKUP' }))
  }
}

