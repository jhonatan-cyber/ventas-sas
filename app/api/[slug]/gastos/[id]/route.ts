import { NextRequest, NextResponse } from 'next/server'
import { ExpenseService } from '@/lib/services/sales/expense-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

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

    return NextResponse.json(expense)
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

    const expense = await ExpenseService.updateExpense(id, {
      userId: body.userId,
      category: body.category?.trim(),
      description: body.description?.trim(),
      amount: body.amount,
      date: body.date ? new Date(body.date) : undefined
    })

    return NextResponse.json(expense)
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

