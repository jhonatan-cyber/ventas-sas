import { NextRequest, NextResponse } from 'next/server'

import { AttachmentInput } from '@/lib/services/admin/support-service'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { SupportTicketSasService } from '@/lib/services/sales/support-ticket-sas-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { saveSupportAttachment } from '@/lib/utils/support-attachments'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { addSupportTicketCommentSchema } from '@/lib/validators/sales-validators'

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof File !== 'undefined' && entry instanceof File
}

async function parseCommentPayload(request: NextRequest) {
  const contentType = request.headers.get("Content-type") || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const attachmentFiles = formData.getAll('attachments').filter(isFile)
    const rawData = {
      content: formData.get("Content")?.toString() ?? '',
    }

    const validation = addSupportTicketCommentSchema.safeParse(rawData)
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

  const validation = await validateRequestBody(addSupportTicketCommentSchema, request)
  if (!validation.success) {
    return { error: validation.response }
  }

  return { data: validation.data, attachmentFiles: [] as File[] }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const token = request.cookies.get("sas-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const currentUser = await AuthSasService.verifyToken(slug, token)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const ticket = await SupportTicketSasService.getTicketById(id, organizationId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const parsed = await parseCommentPayload(request)
    if (parsed.error) {
      return parsed.error
    }

    const { data, attachmentFiles } = parsed

    let attachmentInputs: AttachmentInput[] | undefined
    if (attachmentFiles.length > 0) {
      attachmentInputs = []
      for (const file of attachmentFiles) {
        const saved = await saveSupportAttachment(file, slug, id)
        attachmentInputs.push({
          fileName: saved.fileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
          uploadedBySasUserId: currentUser.id,
        })
      }
    }

    await SupportTicketSasService.addComment({
      ticketId: id,
      authorId: currentUser.id,
      content: data.content,
      attachments: attachmentInputs,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al agregar comentario SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

