/**
 * API endpoint para historial de movimientos de inventario
 */

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { InventoryMovementService } from '@/lib/services/sales/inventory-movement-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    const productId = searchParams.get('productId') || undefined
    const branchId = searchParams.get('branchId') || undefined
    const movementType = searchParams.get('movementType') as any
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const skip = (page - 1) * pageSize

    let result

    if (productId) {
      result = await InventoryMovementService.getProductHistory(productId, {
        branchId,
        startDate,
        endDate,
        movementType,
        limit: pageSize,
        skip,
      })
    } else {
      result = await InventoryMovementService.getOrganizationHistory(organizationId, {
        branchId,
        productId,
        startDate,
        endDate,
        movementType,
        limit: pageSize,
        skip,
      })
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_INVENTORY_MOVEMENTS' }))
  }
}

