import { NextRequest, NextResponse } from 'next/server'
import { CustomerAdminService } from '@/lib/services/admin/customer-admin-service'

// GET - Obtener un cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await CustomerAdminService.getCustomerById(id)
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { razonSocial, nit, ci, nombre, apellido, direccion, telefono, email } = body

    const updatedCustomer = await CustomerAdminService.updateCustomer(id, {
      razonSocial,
      nit,
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      email
    })

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cliente con ese CI o NIT' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el cliente' },
      { status: 500 }
    )
  }
}

// PATCH - Cambiar estado del cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    const updatedCustomer = await CustomerAdminService.updateCustomer(id, {
      isActive
    })

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    console.error('Error al cambiar estado del cliente:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado del cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await CustomerAdminService.deleteCustomer(id)
    return NextResponse.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el cliente' },
      { status: 500 }
    )
  }
}

