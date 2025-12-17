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

    const productId = searchParams.get("Product Id") || undefined
    const branchId = searchParams.get("Branch Id") || undefined
    const movementType = searchParams.get("Movement Type") as any
    const startDate = searchParams.get("Start Date") ? new Date(searchParams.get("Start Date")!) : undefined
    const endDate = searchParams.get("End Date") ? new Date(searchParams.get("End Date")!) : undefined
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '50')
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

