import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/sales/category-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener todas las categorías con paginación y filtros
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

    const { categories, total } = await CategoryService.getAllCategories(
      organizationId,
      skip,
      pageSize,
      search,
      status
    )

    return NextResponse.json({
      categories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener las categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const newCategory = await CategoryService.createCategory(organizationId, {
      name,
      description
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la categoría' },
      { status: 500 }
    )
  }
}

