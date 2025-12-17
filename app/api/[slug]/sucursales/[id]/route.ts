import { NextRequest, NextResponse } from 'next/server'

import { PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { BranchService } from '@/lib/services/sales/branch-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

// GET - Obtener sucursal por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar permiso para actualizar sucursal
    await requirePermission(request, slug, PERMISSIONS.SUCURSALES_EDITAR)

    // Verificar permiso para ver detalles de la sucursal
    await requirePermission(request, slug, PERMISSIONS.SUCURSALES_VER)

    const branch = await BranchService.getBranchById(id)

    if (!branch) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    // Verificar que la sucursal pertenece a la organización
    if (branch.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(branch)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_BRANCH', branchId: id }))
  }
}

// PUT - Actualizar sucursal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar permiso para eliminar sucursal
    await requirePermission(request, slug, PERMISSIONS.SUCURSALES_ELIMINAR)

    // Verificar que la sucursal existe y pertenece a la organización
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.organizationId !== organizationId) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    const branch = await BranchService.updateBranch(id, {
      name: body.name?.trim(),
      address: body.address?.trim(),
      phone: body.phone?.trim(),
      email: body.email?.trim(),
      isActive: body.isActive
    })

    return NextResponse.json(branch)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_BRANCH', branchId: id }))
  }
}

// DELETE - Eliminar sucursal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que la sucursal existe y pertenece a la organización
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.organizationId !== organizationId) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    await BranchService.deleteBranch(id)

    return NextResponse.json({ message: 'Sucursal eliminada correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_BRANCH', branchId: id }))
  }
}

