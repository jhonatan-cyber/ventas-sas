import { NextRequest, NextResponse } from 'next/server'
import { BillingService } from '@/lib/services/admin/billing-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * GET /api/administracion/billing/[id]
 * Obtener una factura por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const invoice = await BillingService.getInvoiceById(params.id)

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * DELETE /api/administracion/billing/[id]
 * Cancelar una factura
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await BillingService.cancelInvoice(params.id)

    return NextResponse.json({
      success: true,
      message: 'Factura cancelada',
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
