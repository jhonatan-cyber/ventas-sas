import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'

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

    const updateData: any = {}
    if (planId) updateData.planId = planId
    if (status) updateData.status = status
    if (billingPeriod) updateData.billingPeriod = billingPeriod
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew

    const updatedSubscription = await SubscriptionManagementService.updateSubscription(id, updateData)

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
    console.error('Error al actualizar suscripción:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una suscripción activa para esta organización' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar la suscripción' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar suscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await SubscriptionManagementService.deleteSubscription(id)
    return NextResponse.json({ message: 'Suscripción eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar suscripción:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la suscripción' },
      { status: 500 }
    )
  }
}

