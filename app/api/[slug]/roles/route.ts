import { NextRequest, NextResponse } from 'next/server'
import { RoleSasService } from '@/lib/services/sales/role-sas-service'
import { getCustomerBySlug } from '@/lib/utils/organization'

// GET - Obtener todos los roles con paginación y filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const sucursalId = searchParams.get('sucursalId') || undefined

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { roles, total } = await RoleSasService.getAllRoles(
      customer.id,
      skip,
      pageSize,
      search,
      status,
      sucursalId
    )

    return NextResponse.json({
      roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener roles:', error)
    return NextResponse.json(
      { error: 'Error al obtener los roles' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo rol
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { nombre, descripcion, sucursalId } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const newRole = await RoleSasService.createRole(customer.id, {
      nombre,
      descripcion,
      sucursalId
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear rol:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el rol' },
      { status: 500 }
    )
  }
}

