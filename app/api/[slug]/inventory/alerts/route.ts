/**
 * API endpoint para alertas de stock bajo
 */

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { InventoryAlertService } from '@/lib/services/sales/inventory-alert-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

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

    // Obtener alertas de stock bajo
    const alerts = await InventoryAlertService.checkLowStock(organizationId)

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_LOW_STOCK_ALERTS' }))
  }
}

