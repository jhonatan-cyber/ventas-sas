/**
 * API endpoint para backup de datos
 */

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { BackupService } from '@/lib/services/sales/backup-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// POST - Crear backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

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
      throw AppError.forbidden('Solo los administradores pueden crear backups')
    }

    // Crear backup
    const result = await BackupService.createOrganizationBackup(organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear backup' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Backup creado correctamente',
      backupFileName: result.backupFileName,
      recordCount: result.recordCount,
      size: result.size,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_BACKUP' }))
  }
}

// GET - Listar backups
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    // Listar backups
    const backups = await BackupService.listBackups(organizationId)

    return NextResponse.json({
      success: true,
      backups,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'LIST_BACKUPS' }))
  }
}

