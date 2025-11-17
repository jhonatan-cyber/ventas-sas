import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { ExpenseService, UpdateExpenseData } from '@/lib/services/sales/expense-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { serializeExpense } from '@/lib/utils/serializers'
import { translateText } from '@/lib/utils/translatable-text'
import { getOrganizationLocale } from '@/lib/utils/i18n-server'

// GET - Obtener gasto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const expense = await ExpenseService.getExpenseById(id)

    if (!expense) {
      throw AppError.notFound('Gasto no encontrado')
    }

    // Verificar que el gasto pertenece a la organización
    if (expense.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(serializeExpense(expense))
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_EXPENSE', expenseId: id }))
  }
}

// PUT - Actualizar gasto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  let currentUser: any = null
  
  try {
    const { slug, id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que el gasto existe y pertenece a la organización
    const existingExpense = await ExpenseService.getExpenseById(id)
    if (!existingExpense || existingExpense.organizationId !== organizationId) {
      throw AppError.notFound('Gasto no encontrado')
    }

    const token = request.cookies.get('sas-auth-token')?.value
    currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      throw AppError.unauthorized('No autenticado')
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      throw AppError.validation('El nombre es requerido')
    }

    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (!description) {
      throw AppError.validation('La descripción es requerida')
    }

    const amount = Number(body.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      throw AppError.validation('El monto debe ser mayor a 0')
    }

    if (!body.date) {
      throw AppError.validation('La fecha es requerida')
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

    // Traducir descripción automáticamente si se está actualizando
    let descriptionTranslations = undefined
    if (description !== undefined && description !== null && description.trim()) {
      try {
        const sourceLanguage = await getOrganizationLocale(slug)
        descriptionTranslations = await translateText(description, sourceLanguage)
      } catch (error) {
        console.error('Error traduciendo descripción de gasto:', error)
        // Continuar sin traducciones si falla
      }
    }

    const updatePayload: UpdateExpenseData = {
      name,
      description,
      descriptionTranslations,
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
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_EXPENSE', expenseId: id, userId: currentUser?.id }))
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
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que el gasto existe y pertenece a la organización
    const existingExpense = await ExpenseService.getExpenseById(id)
    if (!existingExpense || existingExpense.organizationId !== organizationId) {
      throw AppError.notFound('Gasto no encontrado')
    }

    await ExpenseService.deleteExpense(id)

    return NextResponse.json({ message: 'Gasto eliminado correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_EXPENSE', expenseId: id }))
  }
}

