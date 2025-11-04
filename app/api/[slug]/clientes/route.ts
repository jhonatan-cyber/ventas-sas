import { NextRequest, NextResponse } from 'next/server'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { getCustomerBySlug, getOrCreateOrganizationForCustomer } from '@/lib/utils/organization'
import { createSalesCustomerSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

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
    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('No se pudo obtener o crear la organización para el cliente')
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
    return handleApiError(error, createErrorContext(request, { action: 'GET_CUSTOMERS' }))
  }
}

// POST - Crear nuevo cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const customer = await getCustomerBySlug(slug)
    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('No se pudo obtener o crear la organización para el cliente')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createSalesCustomerSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const newCustomer = await SalesCustomerService.createCustomer(organizationId, {
      name: validatedData.name,
      lastName: validatedData.lastName || undefined,
      email: validatedData.email || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address || undefined,
      city: validatedData.city || undefined,
      country: validatedData.country || undefined,
      ruc: validatedData.ruc || undefined
    })

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_CUSTOMER' }))
  }
}

