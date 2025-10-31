import { NextRequest, NextResponse } from 'next/server'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { getCustomerBySlug } from '@/lib/utils/organization'

// GET - Obtener todos los usuarios con paginación y filtros
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
    const rolId = searchParams.get('rolId') || undefined
    const sucursalId = searchParams.get('sucursalId') || undefined

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { usuarios, total } = await UsuarioSasService.getAllUsuarios(
      customer.id,
      skip,
      pageSize,
      search,
      status,
      rolId,
      sucursalId
    )

    return NextResponse.json({
      usuarios,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { ci, nombre, apellido, direccion, telefono, correo, rolId, foto, sucursalId } = body

    if (!ci || !nombre || !apellido || !telefono || !rolId) {
      return NextResponse.json(
        { error: 'El CI, nombre, apellido, teléfono y rol son requeridos' },
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

    const newUsuario = await UsuarioSasService.createUsuario(customer.id, {
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      correo,
      rolId,
      foto,
      sucursalId
    })

    return NextResponse.json(newUsuario, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese CI o correo' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}

