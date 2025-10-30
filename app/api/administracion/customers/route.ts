import { NextRequest, NextResponse } from 'next/server'
import { CustomerAdminService } from '@/lib/services/admin/customer-admin-service'

// GET - Obtener todos los clientes con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const skip = (page - 1) * pageSize

    const { customers, total } = await CustomerAdminService.getAllCustomers(skip, pageSize, search, status)

    return NextResponse.json({
      customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener los clientes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razonSocial, nit, ci, nombre, apellido, direccion, telefono, email } = body

    if (!ci) {
      return NextResponse.json(
        { error: 'El CI es requerido' },
        { status: 400 }
      )
    }

    const newCustomer = await CustomerAdminService.createCustomer({
      razonSocial,
      nit,
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      email
    })

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cliente:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cliente con ese CI o NIT' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear el cliente' },
      { status: 500 }
    )
  }
}

