import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { serializeCashRegister } from '@/lib/utils/serializers'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createCashRegisterSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todas las cajas con paginación y filtros
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
    const branchId = searchParams.get('branchId') || undefined
    const isOpen = searchParams.get('isOpen') === 'true' ? true : searchParams.get('isOpen') === 'false' ? false : undefined

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const skip = (page - 1) * pageSize

    const { cashRegisters, total } = await CashRegisterService.getAllCashRegisters(
      organizationId,
      skip,
      pageSize,
      search,
      branchId,
      isOpen
    )

    return NextResponse.json({
      cashRegisters: cashRegisters.map(serializeCashRegister),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_CASH_REGISTERS' }))
  }
}

// POST - Crear nueva caja
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let currentUser: any = null
  
  try {
    const { slug } = await params

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
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
    const validation = await validateRequestBody(createCashRegisterSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const cashRegister = await CashRegisterService.createCashRegister(organizationId, {
      name: validatedData.name,
      branchId: validatedData.branchId || undefined,
      openingBalance: validatedData.openingBalance || 0,
      openedById: currentUser.id,
    })

    return NextResponse.json(serializeCashRegister(cashRegister), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { 
      action: 'CREATE_CASH_REGISTER',
      userId: currentUser?.id 
    }))
  }
}

