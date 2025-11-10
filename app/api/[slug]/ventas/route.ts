import { NextRequest, NextResponse } from 'next/server'
import { SaleService } from '@/lib/services/sales/sale-service'
import { getOrCreateOrganizationForCustomer, getCustomerBySlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { prisma } from '@/lib/prisma'
import { createSaleSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { serializeSale } from '@/lib/utils/serializers'
import { SalePaymentMethod, SaleStatus } from '@prisma/client'

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
        email: sasUser.email || `${sasUser.nombre.toLowerCase()}.${sasUser.apellido.toLowerCase()}@ventas.local`,
        password: sasUser.password || 'temp',
        fullName: `${sasUser.nombre} ${sasUser.apellido}`.trim(),
        isActive: sasUser.isActive,
      },
    })
  }

  return salesUser
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const customer = await getCustomerBySlug(slug)
    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)

    if (!customer || !organizationId) {
      return NextResponse.json({ error: 'No se pudo obtener o crear la organización para el cliente' }, { status: 404 })
    }

    const skip = (page - 1) * pageSize

    const parseSaleStatus = (value?: string): SaleStatus | 'all' | undefined => {
      if (!value) return undefined
      if (value === 'all') return 'all'
      return (Object.values(SaleStatus) as string[]).includes(value) ? (value as SaleStatus) : undefined
    }

    const parsePaymentMethod = (value?: string): SalePaymentMethod | 'all' | undefined => {
      if (!value) return undefined
      if (value === 'all') return 'all'
      return (Object.values(SalePaymentMethod) as string[]).includes(value) ? (value as SalePaymentMethod) : undefined
    }

    const { sales, total } = await SaleService.getAllSales(
      organizationId,
      skip,
      pageSize,
      search ?? undefined,
      parseSaleStatus(status),
      parsePaymentMethod(paymentMethod),
      customerId ?? undefined,
      startDate,
      endDate,
    )

    return NextResponse.json({
      sales: sales.map(serializeSale),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json({ error: 'Error al obtener las ventas' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let organizationId: string | null = null
  let currentUser: any = null
  
  try {
    const { slug } = await params

    // Obtener o crear automáticamente la organización si no existe
    organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!organizationId) {
      throw AppError.notFound('No se pudo obtener o crear la organización para el cliente')
    }

    const token = request.cookies.get('sas-auth-token')?.value
    currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      throw AppError.unauthorized('No autenticado')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createSaleSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const salesUser = await ensureSalesUser(organizationId, currentUser)
    if (!salesUser) {
      throw AppError.validation('No se pudo asociar el usuario de ventas')
    }

    // Crear venta con datos validados
    const sale = await SaleService.createSale(organizationId, {
      userId: salesUser.id,
      customerId: validatedData.customerId || null,
      customerName: validatedData.customerName || null,
      status: validatedData.status,
      paymentMethod: validatedData.paymentMethod,
      subtotal: validatedData.subtotal,
      discount: validatedData.discount || 0,
      total: validatedData.total,
      notes: validatedData.notes || null,
      items: validatedData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        trackingCodes: item.trackingCodes || [],
      })),
    })

    return NextResponse.json(serializeSale(sale), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { 
      action: 'CREATE_SALE',
      organizationId: organizationId || undefined,
      userId: currentUser?.id 
    }))
  }
}
