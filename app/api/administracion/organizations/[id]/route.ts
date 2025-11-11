import { OrganizationSubscriptionStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener organización por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para ver detalles de organizaciones
    const canView = await PermissionCheckService.hasActivePermission(currentUser.id, 'organizaciones_ver_detalles')
    if (!canView) {
      return NextResponse.json({ error: 'No tiene permiso para ver detalles de organizaciones' }, { status: 403 })
    }

    const { id } = await params
    const organization = await OrganizationAdminService.getOrganizationById(id)
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_ORGANIZATION' }))
  }
}

// PUT - Actualizar organización
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para editar organizaciones
    const canEdit = await PermissionCheckService.hasActivePermission(currentUser.id, 'organizaciones_editar')
    if (!canEdit) {
      return NextResponse.json({ error: 'No tiene permiso para editar organizaciones' }, { status: 403 })
    }

    const { id } = await params
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const normalizeSubscriptionStatus = (value: unknown): OrganizationSubscriptionStatus | undefined => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return (Object.values(OrganizationSubscriptionStatus) as string[]).includes(trimmed)
        ? (trimmed as OrganizationSubscriptionStatus)
        : undefined
    }

    const updateData = {
      razonSocial: body.razonSocial ? body.razonSocial.trim() : undefined,
      nit: body.nit ? body.nit.trim() : undefined,
      address: body.address ? body.address.trim() : undefined, // Asegurar que se guarde la dirección
      phone: body.phone ? body.phone.trim() : undefined, // Asegurar que se guarde el teléfono
      slug: body.slug ? body.slug.trim() : undefined,
      subscriptionPlanId: body.subscriptionPlanId || undefined,
      subscriptionStatus: normalizeSubscriptionStatus(body.subscriptionStatus),
      subscriptionStartDate: body.subscriptionStartDate ? new Date(body.subscriptionStartDate) : undefined,
      subscriptionEndDate: body.subscriptionEndDate ? new Date(body.subscriptionEndDate) : undefined,
      settings: body.settings || undefined,
    }

    const updatedOrganization = await OrganizationAdminService.updateOrganization(id, updateData)

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_ORGANIZATION' }))
  }
}

// PATCH - Activar o desactivar organización (basado en subscriptionStatus)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo isActive debe ser un booleano' },
        { status: 400 }
      )
    }

    // Verificar permiso según la acción
    const permission = isActive ? 'organizaciones_activar' : 'organizaciones_desactivar'
    const canToggle = await PermissionCheckService.hasActivePermission(currentUser.id, permission)
    if (!canToggle) {
      return NextResponse.json(
        { error: `No tiene permiso para ${isActive ? 'activar' : 'desactivar'} organizaciones` },
        { status: 403 }
      )
    }

    // Actualizar el subscriptionStatus basado en isActive
    // Si isActive es false, establecer subscriptionStatus como 'suspended' o 'inactive'
    // Si isActive es true, establecer como 'active' o 'trial'
    const subscriptionStatus = isActive
      ? OrganizationSubscriptionStatus.active
      : OrganizationSubscriptionStatus.suspended
    
    const updatedOrganization = await OrganizationAdminService.updateOrganization(id, {
      subscriptionStatus,
    })

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'TOGGLE_ORGANIZATION_STATUS' }))
  }
}

// DELETE - Eliminar organización
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para eliminar organizaciones
    const canDelete = await PermissionCheckService.hasActivePermission(currentUser.id, 'organizaciones_eliminar')
    if (!canDelete) {
      return NextResponse.json({ error: 'No tiene permiso para eliminar organizaciones' }, { status: 403 })
    }

    const { id } = await params
    await OrganizationAdminService.deleteOrganization(id)

    return NextResponse.json({ 
      success: true,
      message: 'Organización eliminada exitosamente' 
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_ORGANIZATION' }))
  }
}

