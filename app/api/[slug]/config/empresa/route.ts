import { NextRequest, NextResponse } from 'next/server'

import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { prisma } from '@/lib/prisma'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { WhiteLabelService } from '@/lib/services/admin/white-label-service'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar autenticación
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    // Parsear body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Preparar datos para actualizar (manejar strings vacíos como null)
    const updateData: any = {}
    
    if (body.nit !== undefined) {
      updateData.nit = body.nit && body.nit.trim() ? body.nit.trim() : null
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone && body.phone.trim() ? body.phone.trim() : null
    }
    if (body.address !== undefined) {
      updateData.address = body.address && body.address.trim() ? body.address.trim() : null
    }
    if (body.website !== undefined) {
      updateData.website = body.website && body.website.trim() ? body.website.trim() : null
    }

    // Actualizar organización
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    })

    // Si se proporciona un logoUrl, actualizar WhiteLabelBranding
    if (body.logoUrl !== undefined) {
      await WhiteLabelService.updateBranding(organizationId, {
        logoUrl: body.logoUrl || null,
      })
    }

    // Obtener el logo actualizado
    const branding = await WhiteLabelService.getBranding(organizationId)
    const logoUrl = branding?.logoUrl || null

    return NextResponse.json({
      success: true,
      organization: {
        nit: updated.nit,
        phone: updated.phone,
        address: updated.address,
        website: updated.website,
        logoUrl,
      },
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_ORGANIZATION' }))
  }
}

