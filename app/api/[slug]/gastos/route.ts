import { NextRequest, NextResponse } from 'next/server'
import { ExpenseService, CreateExpenseData } from '@/lib/services/sales/expense-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { createExpenseSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { serializeExpense } from '@/lib/utils/serializers'

// GET - Obtener todos los gastos con paginación y filtros
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
    const branchParam = searchParams.get('branchId')
    const branchId = branchParam === 'none' ? null : branchParam === 'all' || !branchParam ? undefined : branchParam
    const userId = searchParams.get('userId') || undefined
    const category = searchParams.get('category') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const skip = (page - 1) * pageSize

    const { expenses, total } = await ExpenseService.getAllExpenses(
      organizationId,
      skip,
      pageSize,
      search,
      branchId,
      startDate,
      endDate,
      userId,
      category,
    )

    return NextResponse.json({
      expenses: expenses.map(serializeExpense),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_EXPENSES' }))
  }
}

// POST - Crear nuevo gasto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

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

    // Convertir fecha a string ISO si es Date
    if (body.date instanceof Date) {
      body.date = body.date.toISOString()
    } else if (typeof body.date === 'string') {
      // Validar que sea una fecha válida
      const dateObj = new Date(body.date)
      if (isNaN(dateObj.getTime())) {
        throw AppError.validation('La fecha no es válida')
      }
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createExpenseSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Manejar branchId
    const branchProvided = Object.prototype.hasOwnProperty.call(body, 'branchId')
    const rawBranch = body.branchId ? String(body.branchId).trim() : ''
    let branchId: string | null | undefined

    if (branchProvided) {
      branchId = rawBranch && rawBranch !== 'all' ? rawBranch : null
    } else {
      branchId = currentUser.sucursalId || currentUser.sucursal?.id || undefined
    }

    const payload: CreateExpenseData = {
      userId: currentUser.id,
      name: validatedData.name,
      description: validatedData.description,
      amount: validatedData.amount,
      date: typeof validatedData.date === 'string' ? new Date(validatedData.date) : validatedData.date,
    }

    if (branchProvided) {
      payload.branchId = branchId ?? null
    } else if (branchId) {
      payload.branchId = branchId
    }

    if (validatedData.category) {
      payload.category = validatedData.category
    }

    const expense = await ExpenseService.createExpense(organizationId, payload)

    return NextResponse.json(serializeExpense(expense), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { 
      action: 'CREATE_EXPENSE',
      userId: currentUser?.id 
    }))
  }
}

