import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

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

// GET - Obtener cotización por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const quotation = await QuotationService.getQuotationById(id)

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la cotización pertenece a la organización
    if (quotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error al obtener cotización:', error)
    return NextResponse.json(
      { error: 'Error al obtener la cotización' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cotización
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Si se actualiza el status directamente
    if (body.status && !body.items) {
      const quotation = await QuotationService.updateStatus(id, body.status)
      return NextResponse.json(quotation)
    }

    // Actualización completa
    const normalizedItems = Array.isArray(body.items)
      ? body.items.map((item: any, index: number) => {
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
      : undefined

    const quotation = await QuotationService.updateQuotation(id, {
      customerId: body.customerId ?? undefined,
      customerName: body.customerName ?? undefined,
      customerPhone: normalizePhone(body.customerPhone),
      status: body.status,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notes: body.notes,
      items: normalizedItems
    })

    return NextResponse.json(quotation)
  } catch (error: any) {
    console.error('Error al actualizar cotización:', error)
    if (error instanceof Error && error.message.startsWith('El producto en la posición')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la cotización' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cotización
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    await QuotationService.deleteQuotation(id)

    return NextResponse.json({ message: 'Cotización eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar cotización:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la cotización' },
      { status: 500 }
    )
  }
}

