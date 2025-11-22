import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SupportService, CreateTicketData } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const createTicketSchema = z.object({
  organizationId: z.string().min(1, 'La organización es requerida'),
  createdById: z.string().optional(),
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
  description: z.string().min(1, 'La descripción es requerida').max(5000, 'La descripción es demasiado larga'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['bug', 'feature_request', 'question', 'billing', 'technical', 'other']).optional(),
})

/**
 * GET /api/administracion/support/tickets
 * Obtener tickets con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si el usuario es administrador o super administrador
    const isAdmin = user.isSuperAdmin || user.role?.toLowerCase() === 'administrador' || user.role?.toLowerCase() === 'admin'

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const priorityParam = searchParams.get('priority')
    const categoryParam = searchParams.get('category')
    
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      assignedToId: searchParams.get('assignedToId') === 'null'
        ? null
        : searchParams.get('assignedToId') || undefined,
      status: (statusParam && ['open', 'in_progress', 'resolved', 'closed'].includes(statusParam))
        ? statusParam as 'open' | 'in_progress' | 'resolved' | 'closed'
        : undefined,
      priority: (priorityParam && ['low', 'medium', 'high', 'urgent'].includes(priorityParam))
        ? priorityParam as 'low' | 'medium' | 'high' | 'urgent'
        : undefined,
      category: (categoryParam && ['bug', 'feature_request', 'question', 'billing', 'technical', 'other'].includes(categoryParam))
        ? categoryParam as 'bug' | 'feature_request' | 'question' | 'billing' | 'technical' | 'other'
        : undefined,
      search: searchParams.get('search') || undefined,
    }

    // Si el usuario no es admin ni super admin, filtrar solo tickets asignados a él
    if (!isAdmin && filters.assignedToId === undefined) {
      filters.assignedToId = user.id
    }

    // Soportar tanto paginación offset como page-based
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = parseInt(searchParams.get('skip') || String((page - 1) * pageSize))
    const take = parseInt(searchParams.get('take') || String(pageSize))

    const result = await SupportService.getTickets(filters, skip, take)

    return NextResponse.json({
      success: true,
      tickets: result.tickets,
      total: result.total,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

/**
 * POST /api/administracion/support/tickets
 * Crear nuevo ticket
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos
    const validation = createTicketSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data: CreateTicketData = validation.data

    const ticket = await SupportService.createTicket(data)

    return NextResponse.json({
      success: true,
      ticket,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
