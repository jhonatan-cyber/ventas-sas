import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { SalesCustomerService } from '@/lib/services/sales/sales-customer-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { updateSalesCustomerSchema } from '@/lib/validators/sales-validators'

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

    // Helper para convertir null a undefined
    const nullToUndefined = <T>(value: T | null | undefined): T | undefined => {
      return value === null ? undefined : value
    }

    const customer = await SalesCustomerService.updateCustomer(id, {
      name: validatedData.name ?? undefined,
      lastName: nullToUndefined(validatedData.lastName),
      email: nullToUndefined(validatedData.email),
      phone: nullToUndefined(validatedData.phone),
      address: nullToUndefined(validatedData.address),
      city: nullToUndefined(validatedData.city),
      country: nullToUndefined(validatedData.country),
      ruc: nullToUndefined(validatedData.ruc),
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

