import { NextRequest, NextResponse } from 'next/server'
import { BillingService } from '@/lib/services/admin/billing-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { z } from 'zod'

const updatePaymentMethodSchema = z.object({
  label: z.string().optional(),
  last4: z.string().optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2000).optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
})

/**
 * PUT /api/administracion/billing/payment-methods/[id]
 * Actualizar mÃ©todo de pago
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validar datos
    const validation = updatePaymentMethodSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos invÃ¡lidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const paymentMethod = await BillingService.updatePaymentMethod(id, data)

    return NextResponse.json({
      success: true,
      paymentMethod,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * PATCH /api/administracion/billing/payment-methods/[id]/set-default
 * Establecer mÃ©todo de pago como predeterminado
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const action = body.action

    if (action === 'set-default') {
      await BillingService.setDefaultPaymentMethod(id)
      return NextResponse.json({
        success: true,
        message: 'MÃ©todo de pago establecido como predeterminado',
      })
    }

    return NextResponse.json(
      { error: 'AcciÃ³n no vÃ¡lida' },
      { status: 400 }
    )
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * DELETE /api/administracion/billing/payment-methods/[id]
 * Eliminar (desactivar) mÃ©todo de pago
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    await BillingService.deletePaymentMethod(id)

    return NextResponse.json({
      success: true,
      message: 'MÃ©todo de pago eliminado exitosamente',
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
