import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'
import { createSubscriptionSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener todas las suscripciones con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

    const skip = (page - 1) * pageSize

    const { subscriptions, total } = await SubscriptionManagementService.getAllSubscriptions(skip, pageSize, search, status)

    // Convertir Decimal a número para serialización
    const serializedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      organization: sub.organization,
      customer: sub.customer,
      plan: {
        ...sub.plan,
        priceMonthly: sub.plan.priceMonthly ? Number(sub.plan.priceMonthly) : null,
        priceYearly: sub.plan.priceYearly ? Number(sub.plan.priceYearly) : null,
      }
    }))

    return NextResponse.json({
      subscriptions: serializedSubscriptions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_SUBSCRIPTIONS' }))
  }
}

// POST - Crear nueva suscripción
export async function POST(request: NextRequest) {
  try {
    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createSubscriptionSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentAdminUser(request)

    const newSubscription = await SubscriptionManagementService.createSubscription({
      organizationId: validatedData.organizationId || undefined,
      customerId: validatedData.customerId || undefined,
      planId: validatedData.planId,
      billingPeriod: validatedData.billingPeriod,
      status: validatedData.status || 'active',
      autoRenew: validatedData.autoRenew,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
    })

    // Registrar creación de suscripción en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          organizationId: newSubscription.organizationId || undefined,
          customerId: newSubscription.customerId || undefined,
          actionType: 'SUBSCRIPTION_CREATED',
          entityType: 'Subscription',
          entityId: newSubscription.id,
          details: {
            planId: newSubscription.planId,
            planName: newSubscription.plan.name,
            billingPeriod: newSubscription.billingPeriod,
            status: newSubscription.status,
            autoRenew: newSubscription.autoRenew,
            startDate: newSubscription.startDate?.toISOString(),
            endDate: newSubscription.endDate?.toISOString(),
          },
        },
        request
      )
    }

    // Convertir Decimal a número
    const serialized = {
      ...newSubscription,
      plan: {
        ...newSubscription.plan,
        priceMonthly: newSubscription.plan.priceMonthly ? Number(newSubscription.plan.priceMonthly) : null,
        priceYearly: newSubscription.plan.priceYearly ? Number(newSubscription.plan.priceYearly) : null,
      }
    }

    return NextResponse.json(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_SUBSCRIPTION' }))
  }
}

