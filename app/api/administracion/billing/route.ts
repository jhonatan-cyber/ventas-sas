import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { BillingService, InvoiceFilters } from '@/lib/services/admin/billing-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const createInvoiceSchema = z.object({
  organizationId: z.string().optional(),
  subscriptionId: z.string().optional(),
  subscriptionPlanId: z.string().optional(),
  billingName: z.string().min(1),
  billingEmail: z.string().email(),
  billingAddress: z.string().optional(),
  billingTaxId: z.string().optional(),
  subtotal: z.number().positive(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  currency: z.string().optional(),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
})

/**
 * GET /api/administracion/billing
 * Obtener facturas con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Paginación
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const skip = (page - 1) * pageSize

    // Filtros
    const filters: InvoiceFilters = {}

    const organizationId = searchParams.get('organizationId')
    if (organizationId) {
      filters.organizationId = organizationId
    }

    const subscriptionId = searchParams.get('subscriptionId')
    if (subscriptionId) {
      filters.subscriptionId = subscriptionId
    }

    const statusParam = searchParams.get('status')
    if (statusParam) {
      if (statusParam.includes(',')) {
        filters.status = statusParam.split(',')
      } else {
        filters.status = statusParam
      }
    }

    const startDate = searchParams.get('startDate')
    if (startDate) {
      filters.startDate = new Date(startDate)
    }

    const endDate = searchParams.get('endDate')
    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    // Obtener estadísticas si se solicita
    const includeStats = searchParams.get('includeStats') === 'true'
    let stats = null
    if (includeStats) {
      stats = await BillingService.getBillingStats(
        filters.organizationId,
        filters.startDate,
        filters.endDate
      )
    }

    // Obtener facturas
    const { invoices, total } = await BillingService.getInvoices(filters, skip, pageSize)

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * POST /api/administracion/billing
 * Crear una nueva factura
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    const invoice = await BillingService.createInvoice(validatedData)

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return handleApiError(error, createErrorContext(request))
  }
}
