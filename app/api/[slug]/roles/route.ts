import { NextRequest, NextResponse } from 'next/server'
import { RoleSasService } from '@/lib/services/sales/role-sas-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { createRoleSasSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener todos los roles con paginación y filtros
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
    const sucursalId = searchParams.get('sucursalId') || undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const skip = (page - 1) * pageSize

    const { roles, total } = await RoleSasService.getAllRoles(
      organizationId,
      skip,
      pageSize,
      search,
      status,
      sucursalId
    )

    return NextResponse.json({
      roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_ROLES_SAS' }))
  }
}

// POST - Crear nuevo rol
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
    const validation = await validateRequestBody(createRoleSasSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Obtener sucursalId del body si está presente (no está en el schema, es opcional)
    const sucursalId = body.sucursalId ? String(body.sucursalId).trim() : undefined

    const newRole = await RoleSasService.createRole(organizationId, {
      nombre: validatedData.nombre,
      descripcion: validatedData.descripcion || undefined,
      sucursalId: sucursalId || undefined
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_ROLE_SAS' }))
  }
}

