import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BillingService } from '@/lib/services/admin/billing-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const createPaymentMethodSchema = z.object({
  organizationId: z.string().optional(),
  type: z.string().min(1, 'El tipo es requerido'),
  provider: z.string().min(1, 'El proveedor es requerido'),
  label: z.string().min(1, 'El alias es requerido'),
  last4: z.string().optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2000).optional(),
  gatewayId: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.any().optional(),
})

/**
 * GET /api/administracion/billing/payment-methods
 * Obtener métodos de pago
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("Organization Id") || undefined

    let paymentMethods = []

    if (organizationId) {
      paymentMethods = await BillingService.getPaymentMethods(organizationId)
    } else {
      // Si no se especifica organización, obtener todos (para admin)
      paymentMethods = await prisma.paymentMethod.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    return NextResponse.json({
      success: true,
      paymentMethods,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * POST /api/administracion/billing/payment-methods
 * Crear nuevo método de pago
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos
    const validation = createPaymentMethodSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const paymentMethod = await BillingService.createPaymentMethod({
      organizationId: data.organizationId,
      type: data.type,
      provider: data.provider,
      label: data.label,
      last4: data.last4,
      brand: data.brand,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      gatewayId: data.gatewayId,
      isDefault: data.isDefault || false,
      metadata: data.metadata,
    })

    return NextResponse.json({
      success: true,
      paymentMethod,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
