import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionAdminService } from '@/lib/services/admin/subscription-admin-service'

// GET - Obtener todos los planes
export async function GET() {
  try {
    const plans = await SubscriptionAdminService.getAllPlans()
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error al obtener planes:', error)
    return NextResponse.json(
      { error: 'Error al obtener los planes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, hasMonthly, hasYearly, priceMonthly, priceYearly, maxUsers, maxProducts, maxOrders, modules } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del plan es requerido' },
        { status: 400 }
      )
    }

    // Validar que al menos un período esté activo
    if (!hasMonthly && !hasYearly) {
      return NextResponse.json(
        { error: 'Debe activar al menos un período (mensual o anual)' },
        { status: 400 }
      )
    }

    const newPlan = await SubscriptionAdminService.createPlan({
      name,
      description,
      hasMonthly,
      hasYearly,
      priceMonthly,
      priceYearly,
      maxUsers,
      maxProducts,
      maxOrders,
      modules,
      isActive: true
    })

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear plan:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un plan con ese nombre' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear el plan' },
      { status: 500 }
    )
  }
}

