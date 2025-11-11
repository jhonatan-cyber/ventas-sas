import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { BranchService } from '@/lib/services/sales/branch-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug, getMaxBranchesByOrganizationId } from '@/lib/utils/organization'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createBranchSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todas las sucursales con paginación y filtros
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

    const { branches, total } = await BranchService.getAllBranches(
      organizationId,
      skip,
      pageSize,
      search,
      status
    )

    return NextResponse.json({
      branches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_BRANCHES' }))
  }
}

// POST - Crear nueva sucursal
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
    const validation = await validateRequestBody(createBranchSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Verificar límite de sucursales del plan
    const maxBranches = await getMaxBranchesByOrganizationId(organizationId)
    if (maxBranches !== null) {
      // Contar sucursales existentes (activas e inactivas, pero no eliminadas)
      const { total: currentBranchesCount } = await BranchService.getAllBranches(
        organizationId,
        0,
        1000, // Obtener todas para contar
        undefined,
        undefined,
        false // includeDeleted: false, no contar eliminadas
      )

      if (currentBranchesCount >= maxBranches) {
        throw AppError.validation(
          `Has alcanzado el límite de sucursales permitidas en tu plan (${maxBranches}). ` +
          `Por favor, actualiza tu plan para crear más sucursales.`
        )
      }
    }

    const branch = await BranchService.createBranch(organizationId, {
      name: validatedData.name,
      address: validatedData.address || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_BRANCH' }))
  }
}

