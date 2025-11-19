import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationLocale } from '@/lib/utils/i18n-server'
import { getOrCreateOrganizationForCustomer, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { serializeQuotation } from '@/lib/utils/serializers'
import { translateText } from '@/lib/utils/translatable-text'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createQuotationSchema } from '@/lib/validators/sales-validators'

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

    let organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      organizationId = await getOrCreateOrganizationForCustomer(slug)
    }
    if (!organizationId) {
      throw AppError.notFound('No se pudo obtener o crear la organización para el cliente')
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
      quotations: quotations.map(serializeQuotation),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_QUOTATIONS' }))
  }
}

// POST - Crear nueva cotización
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    let organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      organizationId = await getOrCreateOrganizationForCustomer(slug)
    }
    if (!organizationId) {
      throw AppError.notFound('No se pudo obtener o crear la organización para el cliente')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar estructura básica con Zod
    // Nota: Validamos la estructura pero permitimos items con productId o productName
    const validation = await validateRequestBody(createQuotationSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Normalizar items (productId o productName)
    const normalizedItems = validatedData.items.map((item: any, index: number) => {
      const rawProductId = item.productId ? String(item.productId).trim() : ''
      const productId = rawProductId.length > 0 && rawProductId !== 'null' ? rawProductId : null
      const manualName = item.productName ? capitalizeWords(String(item.productName).trim()) : ''

      if (!productId && !manualName) {
        throw AppError.validation(`El producto en la posición ${index + 1} requiere un identificador o un nombre.`)
      }

      return {
        productId: productId || undefined,
        productName: manualName || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }
    })

    // Obtener branchId del usuario o cookie
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

    // Priorizar branchId del body si viene, luego el del usuario
    const finalBranchId = validatedData.branchId || branchId || undefined

    const customerPhone = normalizePhone(validatedData.customerPhone || undefined)

    // Traducir notas automáticamente si existen
    let notesTranslations = undefined
    if (validatedData.notes && validatedData.notes.trim()) {
      try {
        const sourceLanguage = await getOrganizationLocale(slug)
        notesTranslations = await translateText(validatedData.notes, sourceLanguage)
      } catch (error) {
        console.error('Error traduciendo notas de cotización:', error)
        // Continuar sin traducciones si falla
      }
    }

    const quotation = await QuotationService.createQuotation(organizationId, {
      customerId: validatedData.customerId || undefined,
      customerName: validatedData.customerName || undefined,
      branchId: finalBranchId,
      customerPhone,
      subtotal: validatedData.subtotal,
      discount: validatedData.discount || 0,
      total: validatedData.total,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      notes: validatedData.notes || undefined,
      notesTranslations,
      items: normalizedItems
    })

    return NextResponse.json(serializeQuotation(quotation), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_QUOTATION' }))
  }
}

