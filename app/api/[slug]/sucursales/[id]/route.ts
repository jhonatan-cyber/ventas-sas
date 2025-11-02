import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/lib/services/sales/branch-service'
import { getCustomerBySlug } from '@/lib/utils/organization'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener sucursal por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const branch = await BranchService.getBranchById(id)

    if (!branch) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    // Verificar que la sucursal pertenece al cliente
    if (branch.customerId !== customer.id) {
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

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que la sucursal existe y pertenece al cliente
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.customerId !== customer.id) {
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

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que la sucursal existe y pertenece al cliente
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.customerId !== customer.id) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    await BranchService.deleteBranch(id)

    return NextResponse.json({ message: 'Sucursal eliminada correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_BRANCH', branchId: id }))
  }
}

