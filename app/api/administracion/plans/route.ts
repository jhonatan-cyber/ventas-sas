import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionAdminService } from '@/lib/services/admin/subscription-admin-service'
import { createSubscriptionPlanSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener todos los planes
export async function GET(request: NextRequest) {
  try {
    const plans = await SubscriptionAdminService.getAllPlans()
    return NextResponse.json(plans)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PLANS' }))
  }
}

// POST - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
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
      maxOrders: validatedData.maxOrders || undefined,
      isActive: validatedData.isActive !== undefined ? validatedData.isActive : true
    })

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_PLAN' }))
  }
}

