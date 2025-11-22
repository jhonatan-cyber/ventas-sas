import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SupportService, UpdateTicketData } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['bug', 'feature_request', 'question', 'billing', 'technical', 'other']).optional(),
  assignedToId: z.string().nullable().optional(),
})

/**
 * GET /api/administracion/support/tickets/[id]
 * Obtener ticket por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const ticket = await SupportService.getTicketById(id)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * PATCH /api/administracion/support/tickets/[id]
 * Actualizar ticket
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

    // Validar datos
    const validation = updateTicketSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data: UpdateTicketData = validation.data

    const ticket = await SupportService.updateTicket(id, data, user.id)

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
