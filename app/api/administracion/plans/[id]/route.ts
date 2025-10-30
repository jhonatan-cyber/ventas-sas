import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionAdminService } from '@/lib/services/admin/subscription-admin-service'

// GET - Obtener plan por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await SubscriptionAdminService.getPlanById(id)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error al obtener plan:', error)
    return NextResponse.json(
      { error: 'Error al obtener el plan' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, hasMonthly, hasYearly, priceMonthly, priceYearly, maxUsers, maxProducts, maxOrders } = body

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (hasMonthly !== undefined) updateData.hasMonthly = hasMonthly
    if (hasYearly !== undefined) updateData.hasYearly = hasYearly
    if (priceMonthly !== undefined) updateData.priceMonthly = priceMonthly
    if (priceYearly !== undefined) updateData.priceYearly = priceYearly
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers ? parseInt(maxUsers) : null
    if (maxProducts !== undefined) updateData.maxProducts = maxProducts ? parseInt(maxProducts) : null
    if (maxOrders !== undefined) updateData.maxOrders = maxOrders ? parseInt(maxOrders) : null

    const updatedPlan = await SubscriptionAdminService.updatePlan(id, updateData)

    return NextResponse.json(updatedPlan)
  } catch (error: any) {
    console.error('Error al actualizar plan:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un plan con ese nombre' },
        { status: 409 }
      )
    }

    // Manejar plan no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el plan' },
      { status: 500 }
    )
  }
}

// PATCH - Activar o desactivar plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere un valor booleano para isActive' },
        { status: 400 }
      )
    }

    const updatedPlan = await SubscriptionAdminService.togglePlanStatus(id, isActive)

    return NextResponse.json(updatedPlan)
  } catch (error: any) {
    console.error('Error al cambiar el estado del plan:', error)
    
    // Manejar plan no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado del plan' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar si el plan existe
    const plan = await SubscriptionAdminService.getPlanById(id)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Intentar eliminar el plan
    await SubscriptionAdminService.deletePlan(id)

    return NextResponse.json(
      { message: 'Plan eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al eliminar plan:', error)

    return NextResponse.json(
      { error: error.message || 'Error al eliminar el plan' },
      { status: 400 }
    )
  }
}

