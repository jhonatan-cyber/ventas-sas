import { NextRequest, NextResponse } from 'next/server'
import { SupportService, CreateCommentData } from '@/lib/services/admin/support-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { z } from 'zod'

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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

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
      ticketId: params.id,
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
