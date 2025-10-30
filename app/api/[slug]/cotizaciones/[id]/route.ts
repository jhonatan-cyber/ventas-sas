import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/sales/quotation-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener cotización por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const quotation = await QuotationService.getQuotationById(id)

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la cotización pertenece a la organización
    if (quotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error al obtener cotización:', error)
    return NextResponse.json(
      { error: 'Error al obtener la cotización' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cotización
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Si se actualiza el status directamente
    if (body.status && !body.items) {
      const quotation = await QuotationService.updateStatus(id, body.status)
      return NextResponse.json(quotation)
    }

    // Actualización completa
    const quotation = await QuotationService.updateQuotation(id, {
      customerId: body.customerId,
      status: body.status,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notes: body.notes,
      items: body.items
    })

    return NextResponse.json(quotation)
  } catch (error: any) {
    console.error('Error al actualizar cotización:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la cotización' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cotización
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la cotización existe y pertenece a la organización
    const existingQuotation = await QuotationService.getQuotationById(id)
    if (!existingQuotation || existingQuotation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    await QuotationService.deleteQuotation(id)

    return NextResponse.json({ message: 'Cotización eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar cotización:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la cotización' },
      { status: 500 }
    )
  }
}

