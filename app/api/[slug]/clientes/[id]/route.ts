import { NextRequest, NextResponse } from 'next/server'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const customer = await SalesCustomerService.getCustomerById(id)
    
    if (!customer || customer.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener el cliente' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const existingCustomer = await SalesCustomerService.getCustomerById(id)

    if (!existingCustomer || existingCustomer.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const payload = {
      name: body.name?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      address: body.address?.trim(),
      ruc: body.ruc?.trim()?.toUpperCase(),
      isActive: body.isActive,
    }

    const customer = await SalesCustomerService.updateCustomer(id, payload)

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const existingCustomer = await SalesCustomerService.getCustomerById(id)

    if (!existingCustomer || existingCustomer.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    await SalesCustomerService.deleteCustomer(id)
    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el cliente' },
      { status: 500 }
    )
  }
}

