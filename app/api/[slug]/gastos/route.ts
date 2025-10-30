import { NextRequest, NextResponse } from 'next/server'
import { ExpenseService } from '@/lib/services/sales/expense-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

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
    const category = searchParams.get('category') || undefined
    const userId = searchParams.get('userId') || undefined
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
      category,
      startDate,
      endDate,
      userId
    )

    return NextResponse.json({
      expenses,
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

    if (!body.category || body.category.trim() === '') {
      return NextResponse.json(
        { error: 'La categoría es requerida' },
        { status: 400 }
      )
    }

    if (!body.description || body.description.trim() === '') {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!body.userId) {
      return NextResponse.json(
        { error: 'El usuario es requerido' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    const expense = await ExpenseService.createExpense(organizationId, {
      userId: body.userId,
      category: body.category.trim(),
      description: body.description.trim(),
      amount: body.amount,
      date: new Date(body.date)
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el gasto' },
      { status: 500 }
    )
  }
}

