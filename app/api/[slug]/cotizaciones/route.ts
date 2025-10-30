import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener todas las cotizaciones con paginación y filtros
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
    const customerId = searchParams.get('customerId') || undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { quotations, total } = await QuotationService.getAllQuotations(
      organizationId,
      skip,
      pageSize,
      search,
      status,
      customerId
    )

    return NextResponse.json({
      quotations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cotizaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cotización
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

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'El cliente es requerido' },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Debe agregar al menos un producto' },
        { status: 400 }
      )
    }

    const quotation = await QuotationService.createQuotation(organizationId, {
      customerId: body.customerId,
      subtotal: body.subtotal || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notes: body.notes,
      items: body.items
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cotización:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la cotización' },
      { status: 500 }
    )
  }
}

