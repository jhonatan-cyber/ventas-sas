import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase())

const normalizePhone = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  let sanitized = trimmed.replace(/[^0-9+]/g, '')
  if (!sanitized) return undefined
  if (!sanitized.startsWith('+')) sanitized = `+${sanitized}`
  if (sanitized === '+') return undefined
  const digits = sanitized.replace(/\D/g, '')
  if (digits.length <= 3) return undefined
  return sanitized
}

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

    const hasExistingCustomer = typeof body.customerId === 'string' && body.customerId.trim().length > 0
    const manualCustomerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''

    if (!hasExistingCustomer && manualCustomerName.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar un cliente o escribir un nombre' },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Debe agregar al menos un producto' },
        { status: 400 }
      )
    }

    const normalizedItems = body.items.map((item: any, index: number) => {
      const rawProductId = typeof item.productId === 'string' ? item.productId.trim() : ''
      const productId = rawProductId.length > 0 ? rawProductId : null
      const manualName = typeof item.productName === 'string' ? capitalizeWords(item.productName.trim()) : ''

      if (!productId && manualName.length === 0) {
        throw new Error(`El producto en la posición ${index + 1} requiere un identificador o un nombre.`)
      }

      const quantity = Number(item.quantity ?? 0)
      const unitPrice = Number(item.unitPrice ?? 0)
      const subtotal = Number(item.subtotal ?? quantity * unitPrice)

      return {
        productId,
        productName: manualName.length > 0 ? manualName : undefined,
        quantity,
        unitPrice,
        subtotal,
      }
    })

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null
    let branchId: string | null = currentUser?.sucursalId ?? currentUser?.sucursal?.id ?? null
    if (!branchId) {
      const branchCookie = request.cookies.get(`sas-branch-${slug}`)?.value
      if (branchCookie) {
        branchId = branchCookie
      }
    }
    if (branchId) {
      branchId = branchId.trim()
      if (branchId.length === 0) {
        branchId = null
      }
    }

    const customerPhone = normalizePhone(body.customerPhone)

    const quotation = await QuotationService.createQuotation(organizationId, {
      customerId: hasExistingCustomer ? body.customerId : undefined,
      customerName: !hasExistingCustomer ? manualCustomerName : undefined,
      branchId,
      customerPhone,
      subtotal: body.subtotal || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notes: body.notes,
      items: normalizedItems
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cotización:', error)
    if (error instanceof Error && error.message.startsWith('El producto en la posición')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear la cotización' },
      { status: 500 }
    )
  }
}

