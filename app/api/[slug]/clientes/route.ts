import { NextRequest, NextResponse } from 'next/server'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener todos los clientes con paginación y filtros
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

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { customers, total } = await SalesCustomerService.getAllCustomers(
      organizationId,
      skip,
      pageSize,
      search,
      status
    )

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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const name = (body.name || '').trim()
    const email = body.email?.trim()
    const phone = body.phone?.trim()
    const address = body.address?.trim()
    const ruc = body.ruc?.trim()?.toUpperCase()

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const newCustomer = await SalesCustomerService.createCustomer(organizationId, {
      name,
      email,
      phone,
      address,
      ruc
    })

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el cliente' },
      { status: 500 }
    )
  }
}

