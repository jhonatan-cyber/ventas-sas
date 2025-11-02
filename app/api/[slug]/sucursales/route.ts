import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/lib/services/sales/branch-service'
import { getCustomerBySlug } from '@/lib/utils/organization'
import { createBranchSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener todas las sucursales con paginación y filtros
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
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const skip = (page - 1) * pageSize

    const { branches, total } = await BranchService.getAllBranches(
      customer.id,
      skip,
      pageSize,
      search,
      status
    )

    return NextResponse.json({
      branches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_BRANCHES' }))
  }
}

// POST - Crear nueva sucursal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createBranchSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const branch = await BranchService.createBranch(customer.id, {
      name: validatedData.name,
      address: validatedData.address || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_BRANCH' }))
  }
}

