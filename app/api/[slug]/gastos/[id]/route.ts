import { NextRequest, NextResponse } from 'next/server'
import { ExpenseService, UpdateExpenseData } from '@/lib/services/sales/expense-service'
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

// GET - Obtener gasto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const expense = await ExpenseService.getExpenseById(id)

    if (!expense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el gasto pertenece a la organización
    if (expense.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(serializeExpense(expense))
  } catch (error) {
    console.error('Error al obtener gasto:', error)
    return NextResponse.json(
      { error: 'Error al obtener el gasto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar gasto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el gasto existe y pertenece a la organización
    const existingExpense = await ExpenseService.getExpenseById(id)
    if (!existingExpense || existingExpense.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
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

    const rawCategory = typeof body.category === 'string' ? body.category.trim() : undefined
    const category = rawCategory && rawCategory.length > 0 ? rawCategory : null

    const branchProvided = Object.prototype.hasOwnProperty.call(body, 'branchId')
    const rawBranch = typeof body.branchId === 'string' ? body.branchId.trim() : ''
    const branchId = branchProvided
      ? rawBranch && rawBranch !== 'all'
        ? rawBranch
        : null
      : undefined

    const updatePayload: UpdateExpenseData = {
      name,
      description,
      amount,
      date: body.date ? new Date(body.date) : undefined,
    }

    if (branchProvided) {
      updatePayload.branchId = branchId ?? null
    }

    if (category !== null) {
      updatePayload.category = category
    } else if (rawCategory !== undefined) {
      updatePayload.category = null
    }

    const expense = await ExpenseService.updateExpense(id, updatePayload)

    return NextResponse.json(serializeExpense(expense))
  } catch (error: any) {
    console.error('Error al actualizar gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar gasto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el gasto existe y pertenece a la organización
    const existingExpense = await ExpenseService.getExpenseById(id)
    if (!existingExpense || existingExpense.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    await ExpenseService.deleteExpense(id)

    return NextResponse.json({ message: 'Gasto eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el gasto' },
      { status: 500 }
    )
  }
}

