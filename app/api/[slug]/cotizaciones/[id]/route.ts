import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { serializeQuotation } from '@/lib/utils/serializers'

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
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const quotation = await QuotationService.getQuotationById(id)

    if (!quotation) {
      throw AppError.notFound('Cotización no encontrada')
    }

    // Verificar que la cotización pertenece a la organización
    if (quotation.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(serializeQuotation(quotation))
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_QUOTATION', quotationId: id }))
  }
}

// PUT - Actualizar cotización
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      throw AppError.notFound('Cotización no encontrada')
    }

    // Si se actualiza el status directamente
    if (body.status && !body.items) {
      const quotation = await QuotationService.updateStatus(id, body.status)
      return NextResponse.json(serializeQuotation(quotation))
    }

    // Actualización completa
    const normalizedItems = Array.isArray(body.items)
      ? body.items.map((item: any, index: number) => {
          const rawProductId = typeof item.productId === 'string' ? item.productId.trim() : ''
          const productId = rawProductId.length > 0 ? rawProductId : null
          const manualName = typeof item.productName === 'string' ? capitalizeWords(item.productName.trim()) : ''

          if (!productId && manualName.length === 0) {
            throw AppError.validation(`El producto en la posición ${index + 1} requiere un identificador o un nombre.`)
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
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_QUOTATION', quotationId: id }))
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
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      throw AppError.notFound('Cotización no encontrada')
    }

    await QuotationService.deleteQuotation(id)

    return NextResponse.json({ message: 'Cotización eliminada correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_QUOTATION', quotationId: id }))
  }
}

