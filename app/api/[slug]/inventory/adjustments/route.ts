/**
 * API endpoint para ajustes de inventario
 */

import { AdjustmentType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { InventoryAdjustmentService } from '@/lib/services/sales/inventory-adjustment-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

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

    // Requiere permiso para gestionar inventario (ajustes)
    await requirePermission(request, slug, EXTRA_PERMISSIONS.INVENTORY_MANAGE)

    const branchId = searchParams.get("Branch Id") || undefined
    const productId = searchParams.get("Product Id") || undefined
    const adjustmentType = searchParams.get("Adjustment Type") as AdjustmentType | undefined
    const startDate = searchParams.get("Start Date") ? new Date(searchParams.get("Start Date")!) : undefined
    const endDate = searchParams.get("End Date") ? new Date(searchParams.get("End Date")!) : undefined
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '50')
    const skip = (page - 1) * pageSize

    const result = await InventoryAdjustmentService.getAdjustments(organizationId, {
      branchId,
      productId,
      adjustmentType,
      startDate,
      endDate,
      limit: pageSize,
      skip,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_INVENTORY_ADJUSTMENTS' }))
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
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

    // Requiere permiso para crear ajustes de inventario
    await requirePermission(request, slug, EXTRA_PERMISSIONS.INVENTORY_MANAGE)

    const { productId, branchId, adjustmentType, quantity, reason, justification, notes } = body

    if (!productId || !adjustmentType || quantity === undefined || !reason || !justification) {
      throw AppError.validation('Faltan campos requeridos')
    }

    if (quantity <= 0 && adjustmentType !== 'CORRECTION') {
      throw AppError.validation('La cantidad debe ser mayor a 0')
    }

    try {
      const adjustment = await InventoryAdjustmentService.createAdjustment({
        organizationId,
        productId,
        branchId,
        adjustmentType: adjustmentType as AdjustmentType,
        quantity,
        reason,
        justification,
        notes,
        userId: currentUser.id,
      })

      return NextResponse.json({
        success: true,
        adjustment,
      })
    } catch (serviceError: any) {
      // Mapear errores específicos del servicio a códigos HTTP apropiados
      const errorMessage = serviceError?.message || 'Error al crear ajuste de inventario'
      
      if (errorMessage.includes('no encontrado') || errorMessage.includes('no encontrada')) {
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 404 }
        )
      }
      
      if (errorMessage.includes('Stock insuficiente') || errorMessage.includes('inactivo')) {
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        )
      }

      // Si es un error de Prisma (clave foránea), devolver un mensaje más claro
      if (serviceError?.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Error de validación: Verifique que todos los datos sean correctos (producto, sucursal, usuario)' },
          { status: 400 }
        )
      }

      // Re-lanzar el error para que handleApiError lo maneje
      throw serviceError
    }
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_INVENTORY_ADJUSTMENT' }))
  }
}

