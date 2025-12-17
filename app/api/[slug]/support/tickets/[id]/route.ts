import { NextRequest, NextResponse } from 'next/server'

import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { SupportTicketSasService } from '@/lib/services/sales/support-ticket-sas-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function GET(
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

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error('Error al obtener ticket SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json().catch(() => ({}))

    // Solo permitimos que el cliente cierre su propio ticket
    if (body.status !== 'closed' && body.action !== 'close') {
      return NextResponse.json(
        { error: 'Operación no permitida' },
        { status: 400 }
      )
    }

    await SupportTicketSasService.closeTicketForCustomer(id, organizationId, currentUser.id)

    const ticket = await SupportTicketSasService.getTicketById(id, organizationId)

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error('Error al cerrar ticket SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

