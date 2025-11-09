import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/sales/category-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener categoría por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const category = await CategoryService.getCategoryById(id)
    
    if (!category) {
      throw AppError.notFound('Categoría no encontrada')
    }

    // Verificar que la categoría pertenece a la organización
    if (category.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(category)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_CATEGORY', categoryId: id }))
  }
}

// PUT - Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }
    
    const { name, description, isActive } = body

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que la categoría existe y pertenece a la organización
    const existingCategory = await CategoryService.getCategoryById(id)
    if (!existingCategory || existingCategory.organizationId !== organizationId) {
      throw AppError.notFound('Categoría no encontrada')
    }

    const category = await CategoryService.updateCategory(id, {
      name,
      description,
      isActive
    })

    return NextResponse.json(category)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_CATEGORY', categoryId: id }))
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que la categoría existe y pertenece a la organización
    const existingCategory = await CategoryService.getCategoryById(id)
    if (!existingCategory || existingCategory.organizationId !== organizationId) {
      throw AppError.notFound('Categoría no encontrada')
    }

    await CategoryService.deleteCategory(id)
    return NextResponse.json({ message: 'Categoría eliminada correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_CATEGORY', categoryId: id }))
  }
}

