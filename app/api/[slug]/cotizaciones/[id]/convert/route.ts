import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { SaleService } from '@/lib/services/sales/sale-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { serializeQuotation, serializeSale } from '@/lib/utils/serializers'

const PAYMENT_METHODS = new Set(['cash', 'card', 'transfer', 'qr'])
const EMPTY_PRODUCT_VALUE = '__none__'

async function ensureSalesUser(organizationId: string, sasUser: any) {
  if (!sasUser) return null

  let salesUser = await prisma.salesUser.findFirst({
    where: {
      organizationId,
      email: sasUser.email || undefined,
    },
  })

  if (!salesUser) {
    salesUser = await prisma.salesUser.create({
      data: {
        organizationId,
        email: sasUser.email || `${(sasUser.nombre ?? 'user').toLowerCase()}.${(sasUser.apellido ?? 'ventas').toLowerCase()}@ventas.local`,
        password: sasUser.password || 'temp',
        fullName: `${sasUser.nombre ?? ''} ${sasUser.apellido ?? ''}`.trim() || sasUser.email || 'Usuario Ventas',
        isActive: sasUser.isActive ?? true,
      },
    })
  }

  return salesUser
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  let organizationId: string | null = null
  let currentUser: any = null
  try {
    const { slug, id } = await params

    organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const token = request.cookies.get('sas-auth-token')?.value
    currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      throw AppError.unauthorized('No autenticado')
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'cash'
    const notes =
      typeof body?.notes === 'string'
        ? body.notes
        : body?.notes === null
          ? null
          : undefined
    const itemsPayloadRaw = Array.isArray(body?.items) ? body.items : null
    const discountFromBody = Number(body?.discount)

    if (!PAYMENT_METHODS.has(paymentMethod)) {
      throw AppError.validation('Método de pago no válido')
    }

    const quotationRaw = await QuotationService.getQuotationById(id)
    if (!quotationRaw || quotationRaw.organizationId !== organizationId) {
      throw AppError.notFound('Cotización no encontrada')
    }

    // Type assertion para acceder a las relaciones incluidas
    const quotation = quotationRaw as typeof quotationRaw & {
      items?: any[]
      customer?: any
      branch?: any
    }

    if (quotation.status === 'converted') {
      throw AppError.validation('La cotización ya fue convertida en venta')
    }

    const mapItems = (itemsSource: any[]) =>
      (itemsSource || []).map((item: any) => {
        const rawProductId = typeof item?.productId === 'string' ? item.productId : ''
        const productId = rawProductId === EMPTY_PRODUCT_VALUE ? '' : rawProductId
        const productName =
          typeof item?.productName === 'string'
            ? item.productName
            : item?.product?.name ?? item?.productName ?? undefined
        const quantity = Number(item?.quantity ?? 0)
        const unitPrice = Number(item?.unitPrice ?? 0)
        const trackingCodes = Array.isArray(item?.trackingCodes)
          ? item.trackingCodes
              .filter((code: unknown) => typeof code === 'string')
              .map((code: string) => code.trim())
              .filter((code: string) => code.length > 0)
          : []
        return {
          productId,
          productName,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
          trackingCodes,
        }
      })

    const bodyItems = itemsPayloadRaw ? mapItems(itemsPayloadRaw) : []
    const quotationItems = mapItems(quotation.items || [])

    const itemsForProcessing = bodyItems.length > 0 ? bodyItems : quotationItems

    const hasInvalidIds = itemsForProcessing.some((item) => !item.productId || !/^[0-9a-fA-F-]{36}$/.test(item.productId))
    if (hasInvalidIds) {
      throw AppError.validation('Todos los productos deben estar seleccionados desde el catálogo antes de convertir la cotización')
    }

    if (itemsForProcessing.length === 0) {
      throw AppError.validation('Debe agregar al menos un producto para convertir la cotización')
    }

    if (itemsForProcessing.some((item) => item.quantity <= 0 || item.unitPrice < 0)) {
      throw AppError.validation('Verifica las cantidades y los precios de los productos')
    }

    if (itemsForProcessing.some((item) => item.trackingCodes.length > 0 && item.trackingCodes.length !== item.quantity)) {
      throw AppError.validation('La cantidad de códigos únicos debe coincidir con la cantidad vendida de cada producto')
    }

    const discountValue = Number.isFinite(discountFromBody) && discountFromBody >= 0
      ? discountFromBody
      : Number(quotation.discount ?? 0)

    const subtotalValue = itemsForProcessing.reduce((sum, item) => sum + item.subtotal, 0)
    const totalValue = subtotalValue - discountValue

    if (totalValue < 0) {
      throw AppError.validation('El total no puede ser negativo. Ajusta el descuento.')
    }

    const salesUser = await ensureSalesUser(organizationId, currentUser)
    if (!salesUser) {
      throw AppError.validation('No se pudo asociar el usuario de ventas')
    }

    const fallbackCustomerName = (() => {
      const full = `${quotation.customer?.name ?? ''} ${quotation.customer?.lastName ?? ''}`.trim()
      return full || quotation.customerName || 'Cliente de cotización'
    })()

    const saleNotes = notes === undefined ? quotation.notes ?? null : notes

    const sale = await SaleService.createSale(organizationId, {
      userId: salesUser.id,
      customerId: quotation.customerId ?? null,
      customerName: fallbackCustomerName,
      status: 'completed',
      paymentMethod,
      subtotal: subtotalValue,
      discount: discountValue,
      total: totalValue,
      notes: saleNotes,
      items: itemsForProcessing.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        ...(item.trackingCodes.length > 0 ? { trackingCodes: item.trackingCodes } : {}),
      })),
    })

    await QuotationService.updateQuotation(id, {
      discount: discountValue,
      subtotal: subtotalValue,
      total: totalValue,
      notes: notes === undefined ? undefined : notes,
      items: itemsForProcessing.map((item) => ({
        productId: item.productId,
        productName: item.productName ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    })

    const convertedQuotation = await QuotationService.updateStatus(id, 'converted')

    return NextResponse.json({
      sale: serializeSale(sale as any),
      quotation: serializeQuotation(convertedQuotation),
    })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, {
      action: 'CONVERT_QUOTATION',
      quotationId: id,
      organizationId: organizationId || undefined,
      userId: currentUser?.id,
    }))
  }
}
