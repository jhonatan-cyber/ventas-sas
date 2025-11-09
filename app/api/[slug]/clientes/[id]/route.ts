import { NextRequest, NextResponse } from 'next/server'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { updateSalesCustomerSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const customer = await SalesCustomerService.getCustomerById(id)
    
    if (!customer || customer.organizationId !== organizationId) {
      throw AppError.notFound('Cliente no encontrado')
    }

    return NextResponse.json(customer)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_SALES_CUSTOMER', customerId: id }))
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const existingCustomer = await SalesCustomerService.getCustomerById(id)

    if (!existingCustomer || existingCustomer.organizationId !== organizationId) {
      throw AppError.notFound('Cliente no encontrado')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(updateSalesCustomerSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const customer = await SalesCustomerService.updateCustomer(id, {
      name: validatedData.name || undefined,
      lastName: validatedData.lastName !== undefined ? validatedData.lastName : undefined,
      email: validatedData.email || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address !== undefined ? validatedData.address : undefined,
      city: validatedData.city || undefined,
      country: validatedData.country || undefined,
      ruc: validatedData.ruc || undefined,
      // isActive puede venir del body directamente si no está en el schema
      isActive: body.isActive !== undefined ? body.isActive : undefined
    })

    return NextResponse.json(customer)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_SALES_CUSTOMER', customerId: id }))
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const existingCustomer = await SalesCustomerService.getCustomerById(id)

    if (!existingCustomer || existingCustomer.organizationId !== organizationId) {
      throw AppError.notFound('Cliente no encontrado')
    }

    await SalesCustomerService.deleteCustomer(id)
    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_SALES_CUSTOMER', customerId: id }))
  }
}

