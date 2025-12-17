import { NextRequest, NextResponse } from 'next/server'

import { captureServerEvent } from '@/lib/analytics/posthog-server'
import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { ExpenseService, CreateExpenseData } from '@/lib/services/sales/expense-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'
import { serializeExpense } from '@/lib/utils/serializers'
// import { translateText } from '@/lib/utils/translatable-text' - removed
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createExpenseSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todos los gastos con paginación y filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '10')
    const search = searchParams.get("Search") || undefined
    const branchParam = searchParams.get("Branch Id")
    const branchId = branchParam === 'none' ? null : branchParam === 'all' || !branchParam ? undefined : branchParam
    const userId = searchParams.get("User Id") || undefined
    const category = searchParams.get("Category") || undefined
    const startDate = searchParams.get("Start Date") ? new Date(searchParams.get("Start Date")!) : undefined
    const endDate = searchParams.get("End Date") ? new Date(searchParams.get("End Date")!) : undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar permiso para gestionar gastos
    await requirePermission(request, slug, EXTRA_PERMISSIONS.GASTOS_MANAGE)

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
  let currentUser: Awaited<ReturnType<typeof AuthSasService.verifyToken>> | null = null

  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar permiso para crear gastos
    await requirePermission(request, slug, EXTRA_PERMISSIONS.GASTOS_MANAGE)

    const token = request.cookies.get("sas-auth-token")?.value
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

    // Descripción sin traducción automática

    const expense = await ExpenseService.createExpense(organizationId, payload)

    // Tracking de creación de gasto
    captureServerEvent(currentUser.id, 'sas_expense_created', {
      expenseId: expense.id,
      organizationId,
      organizationSlug: slug,
      amount: Number(expense.amount),
      category: expense.category || null,
      hasDescription: !!expense.description,
      branchId: expense.branchId || null,
    })

    return NextResponse.json(serializeExpense(expense), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { 
      action: 'CREATE_EXPENSE',
      userId: currentUser?.id 
    }))
  }
}

