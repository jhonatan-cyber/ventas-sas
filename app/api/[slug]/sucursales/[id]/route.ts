import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/lib/services/sales/branch-service'
import { getCustomerBySlug } from '@/lib/utils/organization'

// GET - Obtener sucursal por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const branch = await BranchService.getBranchById(id)

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la sucursal pertenece al cliente
    if (branch.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Error al obtener sucursal:', error)
    return NextResponse.json(
      { error: 'Error al obtener la sucursal' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar sucursal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la sucursal existe y pertenece al cliente
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      )
    }

    const branch = await BranchService.updateBranch(id, {
      name: body.name?.trim(),
      address: body.address?.trim(),
      phone: body.phone?.trim(),
      email: body.email?.trim(),
      isActive: body.isActive
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Error al actualizar sucursal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la sucursal' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la sucursal existe y pertenece al cliente
    const existingBranch = await BranchService.getBranchById(id)
    if (!existingBranch || existingBranch.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      )
    }

    await BranchService.deleteBranch(id)

    return NextResponse.json({ message: 'Sucursal eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar sucursal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la sucursal' },
      { status: 500 }
    )
  }
}

