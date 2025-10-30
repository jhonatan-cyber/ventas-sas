import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManagementService } from '@/lib/services/admin/subscription-management-service'

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
    console.error('Error al obtener suscripciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las suscripciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva suscripción
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, customerId, planId, billingPeriod, startDate, endDate, autoRenew } = body

    if ((!organizationId && !customerId) || !planId || !billingPeriod) {
      return NextResponse.json(
        { error: 'Cliente/Organización, plan y período de facturación son requeridos' },
        { status: 400 }
      )
    }

    const newSubscription = await SubscriptionManagementService.createSubscription({
      organizationId,
      customerId,
      planId,
      billingPeriod,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      autoRenew
    })

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
  } catch (error: any) {
    console.error('Error al crear suscripción:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una suscripción activa para esta organización' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear la suscripción' },
      { status: 500 }
    )
  }
}

