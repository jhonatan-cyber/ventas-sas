import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/lib/services/sales/branch-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener todas las sucursales con paginación y filtros
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

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { branches, total } = await BranchService.getAllBranches(
      organizationId,
      skip,
      pageSize,
      search,
      status
    )

    return NextResponse.json({
      branches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener sucursales:', error)
    return NextResponse.json(
      { error: 'Error al obtener las sucursales' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva sucursal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const branch = await BranchService.createBranch(organizationId, {
      name: body.name.trim(),
      address: body.address?.trim(),
      phone: body.phone?.trim(),
      email: body.email?.trim()
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear sucursal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la sucursal' },
      { status: 500 }
    )
  }
}

