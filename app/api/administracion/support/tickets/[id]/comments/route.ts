import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { SupportService, CreateCommentData, AttachmentInput } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { saveSupportAttachment } from '@/lib/utils/support-attachments'

const createCommentSchema = z.object({
  content: z.string().min(1, 'El contenido es requerido').max(5000, 'El contenido es demasiado largo'),
  isInternal: z.boolean().optional(),
})

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof File !== 'undefined' && entry instanceof File
}

async function parseAdminCommentPayload(request: NextRequest) {
  const contentType = request.headers.get("Content-type") || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const attachmentFiles = formData.getAll('attachments').filter(isFile)
    const rawData = {
      content: formData.get("Content")?.toString() ?? '',
      isInternal: formData.get("Is Internal")?.toString() === 'true',
    }

    const validation = createCommentSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        error: NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.flatten() },
          { status: 400 }
        ),
      }
    }

    return { data: validation.data, attachmentFiles }
  }

  const body = await request.json()
  const validation = createCommentSchema.safeParse(body)
  if (!validation.success) {
    return {
      error: NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      ),
    }
  }

  return { data: validation.data, attachmentFiles: [] as File[] }
}

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

    const parsed = await parseAdminCommentPayload(request)
    if (parsed.error) {
      return parsed.error
    }

    const { data, attachmentFiles } = parsed

    const ticketRecord = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        organization: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!ticketRecord?.organization?.slug) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    let attachmentInputs: AttachmentInput[] | undefined
    if (attachmentFiles.length > 0) {
      attachmentInputs = []
      for (const file of attachmentFiles) {
        const saved = await saveSupportAttachment(file, ticketRecord.organization.slug, id)
        attachmentInputs.push({
          fileName: saved.fileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
          uploadedById: user.id,
        })
      }
    }

    const commentData: CreateCommentData = {
      ticketId: id,
      authorId: user.id,
      authorType: 'admin',
      content: data.content,
      isInternal: data.isInternal || false,
      attachments: attachmentInputs,
    }

    const comment = await SupportService.addComment(commentData)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
