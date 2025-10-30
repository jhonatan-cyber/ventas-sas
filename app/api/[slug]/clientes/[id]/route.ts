import { NextRequest, NextResponse } from 'next/server'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { getOrganizationIdBySlug } from '@/lib/utils/organization'

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const customer = await SalesCustomerService.getCustomerById(id)
    
    if (!customer) {
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
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, address, city, country, ruc, isActive } = body

    const customer = await SalesCustomerService.updateCustomer(id, {
      name,
      email,
      phone,
      address,
      city,
      country,
      ruc,
      isActive
    })

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
    const { id } = await params
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

