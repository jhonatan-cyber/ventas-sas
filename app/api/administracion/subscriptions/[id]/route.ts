import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener una suscripción por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await SubscriptionManagementService.getSubscriptionById(id)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      )
    }

    // Convertir Decimal a número
    const serialized = {
      ...subscription,
      plan: {
        ...subscription.plan,
        priceMonthly: subscription.plan.priceMonthly ? Number(subscription.plan.priceMonthly) : null,
        priceYearly: subscription.plan.priceYearly ? Number(subscription.plan.priceYearly) : null,
      }
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error al obtener suscripción:', error)
    return NextResponse.json(
      { error: 'Error al obtener la suscripción' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar suscripción
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { planId, status, billingPeriod, startDate, endDate, autoRenew } = body

    // Obtener usuario actual y suscripción objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetSubscription = await SubscriptionManagementService.getSubscriptionById(id)

    if (!targetSubscription) {
      throw AppError.notFound('Suscripción no encontrada')
    }

    const updateData: any = {}
    if (planId) updateData.planId = planId
    if (status) updateData.status = status
    if (billingPeriod) updateData.billingPeriod = billingPeriod
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew

    const updatedSubscription = await SubscriptionManagementService.updateSubscription(id, updateData)

    // Registrar actualización de suscripción en auditoría
    if (currentUser) {
      const changedFields: string[] = []
      const oldValues: Record<string, any> = {}
      const newValues: Record<string, any> = {}

      if (planId && targetSubscription.planId !== planId) {
        changedFields.push('planId')
        oldValues.planId = targetSubscription.planId
        oldValues.planName = targetSubscription.plan.name
        newValues.planId = planId
        newValues.planName = updatedSubscription.plan.name
      }

      if (status && targetSubscription.status !== status) {
        changedFields.push('status')
        oldValues.status = targetSubscription.status
        newValues.status = status

        // Detectar cancelación específicamente
        if (status === 'cancelled' || status === 'canceled') {
          await SecurityAuditLogger.logSensitiveAction(
            {
              userId: currentUser.id,
              organizationId: targetSubscription.organizationId || undefined,
              customerId: targetSubscription.customerId || undefined,
              actionType: 'SUBSCRIPTION_CANCELLED',
              entityType: 'Subscription',
              entityId: id,
              details: {
                previousStatus: targetSubscription.status,
                planName: targetSubscription.plan.name,
                cancelledAt: new Date().toISOString(),
              },
            },
            request
          )
        }
      }

      if (billingPeriod && targetSubscription.billingPeriod !== billingPeriod) {
        changedFields.push('billingPeriod')
        oldValues.billingPeriod = targetSubscription.billingPeriod
        newValues.billingPeriod = billingPeriod
      }

      if (autoRenew !== undefined && targetSubscription.autoRenew !== autoRenew) {
        changedFields.push('autoRenew')
        oldValues.autoRenew = targetSubscription.autoRenew
        newValues.autoRenew = autoRenew
      }

      if (changedFields.length > 0 && status !== 'cancelled' && status !== 'canceled') {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            organizationId: targetSubscription.organizationId || undefined,
            customerId: targetSubscription.customerId || undefined,
            actionType: 'SUBSCRIPTION_UPDATED',
            entityType: 'Subscription',
            entityId: id,
            details: {
              changedFields,
              oldValues,
              newValues,
              planName: updatedSubscription.plan.name,
            },
          },
          request
        )
      }
    }

    // Convertir Decimal a número
    const serialized = {
      ...updatedSubscription,
      plan: {
        ...updatedSubscription.plan,
        priceMonthly: updatedSubscription.plan.priceMonthly ? Number(updatedSubscription.plan.priceMonthly) : null,
        priceYearly: updatedSubscription.plan.priceYearly ? Number(updatedSubscription.plan.priceYearly) : null,
      }
    }

    return NextResponse.json(serialized)
  } catch (error: any) {
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_SUBSCRIPTION', subscriptionId: id }))
  }
}

// DELETE - Eliminar suscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener usuario actual y suscripción objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetSubscription = await SubscriptionManagementService.getSubscriptionById(id)

    if (!targetSubscription) {
      throw AppError.notFound('Suscripción no encontrada')
    }

    await SubscriptionManagementService.deleteSubscription(id)

    // Registrar eliminación de suscripción en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          organizationId: targetSubscription.organizationId || undefined,
          customerId: targetSubscription.customerId || undefined,
          actionType: 'SUBSCRIPTION_CANCELLED',
          entityType: 'Subscription',
          entityId: id,
          details: {
            action: 'deleted',
            planName: targetSubscription.plan.name,
            previousStatus: targetSubscription.status,
            billingPeriod: targetSubscription.billingPeriod,
            deletedAt: new Date().toISOString(),
          },
        },
        request
      )
    }

    return NextResponse.json({ message: 'Suscripción eliminada exitosamente' })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_SUBSCRIPTION', subscriptionId: id }))
  }
}

