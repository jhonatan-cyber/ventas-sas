import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { CategoryService } from '@/lib/services/sales/category-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createCategorySchema } from '@/lib/validators/sales-validators'

// GET - Obtener todas las categorías con paginación y filtros
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

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const skip = (page - 1) * pageSize

    const { categories, total } = await CategoryService.getAllCategories(
      organizationId,
      skip,
      pageSize,
      search,
      status
    )

    return NextResponse.json({
      categories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_CATEGORIES' }))
  }
}

// POST - Crear nueva categoría
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createCategorySchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const newCategory = await CategoryService.createCategory(organizationId, {
      name: validatedData.name,
      description: validatedData.description || undefined
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_CATEGORY' }))
  }
}

