import { NextRequest, NextResponse } from 'next/server'

import { AttachmentInput, SupportService } from '@/lib/services/admin/support-service'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { SupportTicketSasService } from '@/lib/services/sales/support-ticket-sas-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { saveSupportAttachment } from '@/lib/utils/support-attachments'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createSupportTicketSchema } from '@/lib/validators/sales-validators'

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof File !== 'undefined' && entry instanceof File
}

async function parseTicketPayload(request: NextRequest) {
  const contentType = request.headers.get("Content-type") || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const attachmentFiles = formData.getAll('attachments').filter(isFile)

    const rawData = {
      title: formData.get("Title")?.toString() ?? '',
      description: formData.get("Description")?.toString() ?? '',
      priority: formData.get("Priority")?.toString() ?? undefined,
      category: formData.get("Category")?.toString() ?? undefined,
      contactEmail: formData.get("Contact Email")?.toString() ?? undefined,
      contactPhone: formData.get("Contact Phone")?.toString() ?? undefined,
    }

    const validation = createSupportTicketSchema.safeParse(rawData)
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

  const validation = await validateRequestBody(createSupportTicketSchema, request)

  if (!validation.success) {
    return { error: validation.response }
  }

  return { data: validation.data, attachmentFiles: [] as File[] }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
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

    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("Page") || '1')
    const pageSize = Number(searchParams.get("Page Size") || '10')
    const statusParam = searchParams.get("Status") || undefined
    const search = searchParams.get("Search") || undefined

    const { tickets, total } = await SupportTicketSasService.listTickets(organizationId, {
      status: (statusParam as any) || 'all',
      search: search || undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const stats = await SupportTicketSasService.getStats(organizationId)

    return NextResponse.json({
      success: true,
      tickets,
      total,
      page,
      pageSize,
      stats,
    })
  } catch (error) {
    console.error('Error al obtener tickets SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
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

    const parsed = await parseTicketPayload(request)
    if (parsed.error) {
      return parsed.error
    }
    const { data, attachmentFiles } = parsed

    const ticket = await SupportTicketSasService.createTicket({
      organizationId,
      sasUserId: currentUser.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      contactName: currentUser.nombre
        ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim()
        : undefined,
      contactEmail: data.contactEmail || currentUser.email || undefined,
      contactPhone: data.contactPhone || currentUser.phone || undefined,
    })

    if (attachmentFiles.length > 0) {
      const savedAttachments: AttachmentInput[] = []
      for (const file of attachmentFiles) {
        const saved = await saveSupportAttachment(file, slug, ticket.id)
        savedAttachments.push({
          fileName: saved.fileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
          uploadedBySasUserId: currentUser.id,
        })
      }

      await SupportService.addAttachmentsToTicket(ticket.id, savedAttachments)
    }

    await SupportTicketSasService.addComment({
      ticketId: ticket.id,
      authorId: currentUser.id,
      content: data.description,
    })

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
        closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
      },
    })
  } catch (error) {
    console.error('Error al crear ticket SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

