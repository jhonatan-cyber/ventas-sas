import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

// GET - Obtener una suscripción por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para ver detalles de suscripciones
    const canView = await PermissionCheckService.hasActivePermission(currentUser.id, 'suscripciones_ver_detalles')
    if (!canView) {
      return NextResponse.json({ error: 'No tiene permiso para ver detalles de suscripciones' }, { status: 403 })
    }

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
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para editar suscripciones
    const canEdit = await PermissionCheckService.hasActivePermission(currentUser.id, 'suscripciones_editar')
    if (!canEdit) {
      return NextResponse.json({ error: 'No tiene permiso para editar suscripciones' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { planId, status, billingPeriod, startDate, endDate, autoRenew } = body

    // Obtener suscripción objetivo para auditoría
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
          const customerId = targetSubscription.organization?.customerOrganizations?.[0]?.customer?.id
          await SecurityAuditLogger.logSensitiveAction(
            {
              userId: currentUser.id,
              organizationId: targetSubscription.organizationId || undefined,
              customerId: customerId || undefined,
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
        const customerId = targetSubscription.organization?.customerOrganizations?.[0]?.customer?.id
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            organizationId: targetSubscription.organizationId || undefined,
            customerId: customerId || undefined,
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
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_SUBSCRIPTION', subscriptionId: id }))
  }
}

// DELETE - Eliminar suscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para eliminar suscripciones
    const canDelete = await PermissionCheckService.hasActivePermission(currentUser.id, 'suscripciones_eliminar')
    if (!canDelete) {
      return NextResponse.json({ error: 'No tiene permiso para eliminar suscripciones' }, { status: 403 })
    }

    const { id } = await params

    // Obtener suscripción objetivo para auditoría
    const targetSubscription = await SubscriptionManagementService.getSubscriptionById(id)

    if (!targetSubscription) {
      throw AppError.notFound('Suscripción no encontrada')
    }

    await SubscriptionManagementService.deleteSubscription(id)

    // Registrar eliminación de suscripción en auditoría
    if (currentUser) {
      const customerId = targetSubscription.organization?.customerOrganizations?.[0]?.customer?.id
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          organizationId: targetSubscription.organizationId || undefined,
          customerId: customerId || undefined,
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
  } catch (error: any) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_SUBSCRIPTION', subscriptionId: id }))
  }
}

