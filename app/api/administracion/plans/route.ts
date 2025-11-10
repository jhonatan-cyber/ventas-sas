import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { SubscriptionAdminService } from '@/lib/services/admin/subscription-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createSubscriptionPlanSchema } from '@/lib/validators/admin-validators'

// GET - Obtener todos los planes
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar planes
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'planes_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar planes' }, { status: 403 })
    }

    const plans = await SubscriptionAdminService.getAllPlans()
    return NextResponse.json(plans)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PLANS' }))
  }
}

// POST - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear planes
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'planes_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear planes' }, { status: 403 })
    }
    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod (incluye validación de al menos un período)
    const validation = await validateRequestBody(createSubscriptionPlanSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const newPlan = await SubscriptionAdminService.createPlan({
      name: validatedData.name,
      description: validatedData.description || undefined,
      hasMonthly: validatedData.hasMonthly,
      hasYearly: validatedData.hasYearly,
      priceMonthly: validatedData.priceMonthly || undefined,
      priceYearly: validatedData.priceYearly || undefined,
      features: validatedData.features || undefined,
      modules: validatedData.modules || undefined,
      maxUsers: validatedData.maxUsers || undefined,
      maxProducts: validatedData.maxProducts || undefined,
      maxBranches: validatedData.maxBranches || undefined,
      isActive: validatedData.isActive !== undefined ? validatedData.isActive : true
    })

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_PLAN' }))
  }
}

