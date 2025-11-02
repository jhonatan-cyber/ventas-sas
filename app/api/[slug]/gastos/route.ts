import { NextRequest, NextResponse } from 'next/server'
import { ExpenseService, CreateExpenseData } from '@/lib/services/sales/expense-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

function serializeExpense(expense: any) {
  return {
    ...expense,
    amount: Number(expense.amount ?? 0),
    date: expense.date ? expense.date.toISOString() : null,
    createdAt: expense.createdAt ? expense.createdAt.toISOString() : null,
    updatedAt: expense.updatedAt ? expense.updatedAt.toISOString() : null,
    user: expense.user
      ? {
          id: expense.user.id,
          fullName: expense.user.fullName,
          email: expense.user.email,
        }
      : null,
    branch: expense.branch
      ? {
          id: expense.branch.id,
          name: expense.branch.name,
          address: expense.branch.address,
        }
      : null,
  }
}

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
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
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
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo gasto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (!description) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      )
    }

    const amount = Number(body.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    const category = typeof body.category === 'string' ? body.category.trim() : undefined
    const branchProvided = Object.prototype.hasOwnProperty.call(body, 'branchId')
    const rawBranch = typeof body.branchId === 'string' ? body.branchId.trim() : ''
    let branchId: string | null | undefined

    if (branchProvided) {
      branchId = rawBranch && rawBranch !== 'all' ? rawBranch : null
    } else {
      branchId = currentUser.sucursalId || currentUser.sucursal?.id || undefined
    }

    const payload: CreateExpenseData = {
      userId: currentUser.id,
      name,
      description,
      amount,
      date: new Date(body.date),
    }

    if (branchProvided) {
      payload.branchId = branchId ?? null
    } else if (branchId) {
      payload.branchId = branchId
    }

    if (category) {
      payload.category = category
    }

    const expense = await ExpenseService.createExpense(organizationId, payload)

    return NextResponse.json(serializeExpense(expense), { status: 201 })
  } catch (error: any) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el gasto' },
      { status: 500 }
    )
  }
}

