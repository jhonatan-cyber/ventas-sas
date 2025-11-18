/**
 * API endpoint para operaciones con transferencias específicas
 */

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { InventoryTransferService } from '@/lib/services/sales/inventory-transfer-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    const { action, notes } = body

    if (!action) {
      throw AppError.validation('Acción requerida')
    }

    let result

    switch (action) {
      case 'approve':
        result = await InventoryTransferService.approveTransfer(id, currentUser.id, notes)
        break
      case 'reject':
        result = await InventoryTransferService.rejectTransfer(id, currentUser.id, notes)
        break
      case 'complete':
        result = await InventoryTransferService.completeTransfer(id, currentUser.id)
        break
      default:
        throw AppError.validation(`Acción no válida: ${action}`)
    }

    return NextResponse.json({
      success: true,
      transfer: result,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_INVENTORY_TRANSFER' }))
  }
}

