import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SupportService, CreateCommentData } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const createCommentSchema = z.object({
  content: z.string().min(1, 'El contenido es requerido').max(5000, 'El contenido es demasiado largo'),
  isInternal: z.boolean().optional(),
})

/**
 * POST /api/administracion/support/tickets/[id]/comments
 * Agregar comentario a un ticket
 */
export async function POST(
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
    const validation = createCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data: CreateCommentData = {
      ticketId: id,
      authorId: user.id,
      authorType: 'admin',
      content: validation.data.content,
      isInternal: validation.data.isInternal || false,
    }

    const comment = await SupportService.addComment(data)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
