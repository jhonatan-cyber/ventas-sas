import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
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

    // Obtener usuario actual
    const token = request.cookies.get("sas-auth-token")?.value
    let currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      const sessionCookie = request.cookies.get("sas-session")?.value
      if (sessionCookie) {
        try {
          const decoded = Buffer.from(sessionCookie, "base64").toString("utf8")
          const session = JSON.parse(decoded)
          currentUser = {
            sucursalId: session.sucursalId ?? null,
            sucursal: session.sucursalId ? { id: session.sucursalId } : null,
            rol: session.rol ? { nombre: session.rol } : null,
          } as any
        } catch (error) {
          console.error("No se pudo decodificar la cookie de sesión", error)
        }
      }
    }

    const currentUserBranchId = currentUser?.sucursalId || currentUser?.sucursal?.id || null
    const roleName = currentUser?.rol?.nombre?.toLowerCase() || ""
    const isAdmin = roleName.includes("administrador") || roleName === "admin"

    // Si es administrador, mostrar todas las categorías
    // Si no es administrador, mostrar solo categorías que tienen productos en su sucursal
    const branchId = isAdmin ? null : currentUserBranchId

    const skip = (page - 1) * pageSize

    const { categories, total } = await CategoryService.getAllCategories(
      organizationId,
      skip,
      pageSize,
      search,
      status,
      branchId
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

