import { NextRequest, NextResponse } from 'next/server'
import { BillingService } from '@/lib/services/admin/billing-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { z } from 'zod'

const createPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentMethodId: z.string().optional(),
  paymentGateway: z.string(),
  paymentGatewayId: z.string().optional(),
  paymentIntentId: z.string().optional(),
  paymentMethodType: z.string().optional(),
  last4: z.string().optional(),
  brand: z.string().optional(),
  metadata: z.any().optional(),
})

/**
 * POST /api/administracion/billing/payments
 * Crear un pago
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    const payment = await BillingService.createPayment(validatedData)

    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return handleApiError(error, createErrorContext(request))
  }
}
