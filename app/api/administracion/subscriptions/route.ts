import { SubscriptionStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createSubscriptionSchema } from '@/lib/validators/admin-validators'

// GET - Obtener todas las suscripciones con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar suscripciones
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'suscripciones_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar suscripciones' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '10')
    const search = searchParams.get("Search") || undefined
    const statusParam = searchParams.get("Status")
    const status = statusParam && ['active', 'cancelled', 'expired', 'trial'].includes(statusParam) 
      ? statusParam as SubscriptionStatus 
      : undefined

    const skip = (page - 1) * pageSize

    const { subscriptions, total } = await SubscriptionManagementService.getAllSubscriptions(skip, pageSize, search, status)

    // Convertir Decimal a número para serialización y mapear customer desde organization
    const serializedSubscriptions = subscriptions.map((sub: any) => ({
      ...sub,
      organization: sub.organization,
      customer: sub.organization?.customerOrganizations?.[0]?.customer || null,
      plan: {
        ...sub.plan,
        priceMonthly: sub.plan?.priceMonthly ? Number(sub.plan.priceMonthly) : null,
        priceYearly: sub.plan?.priceYearly ? Number(sub.plan.priceYearly) : null,
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
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear suscripciones
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'suscripciones_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear suscripciones' }, { status: 403 })
    }

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

    const newSubscription = await SubscriptionManagementService.createSubscription({
      organizationId: validatedData.organizationId || undefined,
      planId: validatedData.planId,
      billingPeriod: validatedData.billingPeriod || 'monthly',
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
          actionType: 'SUBSCRIPTION_CREATED',
          entityType: 'Subscription',
          entityId: newSubscription.id,
          details: {
            planId: newSubscription.planId,
            planName: (newSubscription as any).plan?.name || 'N/A',
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
      plan: (newSubscription as any).plan ? {
        ...(newSubscription as any).plan,
        priceMonthly: (newSubscription as any).plan?.priceMonthly ? Number((newSubscription as any).plan.priceMonthly) : null,
        priceYearly: (newSubscription as any).plan?.priceYearly ? Number((newSubscription as any).plan.priceYearly) : null,
      } : null
    }

    return NextResponse.json(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_SUBSCRIPTION' }))
  }
}

