import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { OrganizationAdminService } from '@/lib/services/admin/organization-admin-service'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener todas las organizaciones
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar organizaciones
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'organizaciones_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar organizaciones' }, { status: 403 })
    }

    const organizations = await OrganizationAdminService.getAllOrganizations()
    return NextResponse.json({ organizations })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_ORGANIZATIONS' }))
  }
}

// POST - Crear nueva organización
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear organizaciones
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'organizaciones_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear organizaciones' }, { status: 403 })
    }

    // Parsear body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar que se proporcionen los campos requeridos
    // Una organización es una empresa con: razonSocial, address, phone, slug, customerId
    // El ownerId se toma del usuario administrador actual (currentUser.id)
    if (!body.razonSocial || !body.address || !body.phone || !body.slug || !body.customerId) {
      throw AppError.validation('Razón social, dirección, teléfono, slug y cliente dueño son requeridos')
    }

    // Crear la organización (empresa)
    // El ownerId se crea automáticamente como un Profile basado en el cliente
    // El cliente se usa para crear el Profile del dueño y el UsuarioSas administrador
    // El customerId se usa para crear la relación CustomerOrganization
    const newOrganization = await OrganizationAdminService.createOrganization({
      razonSocial: body.razonSocial,
      nit: body.nit ? body.nit.trim() : undefined,
      address: body.address ? body.address.trim() : undefined, // Asegurar que se guarde la dirección
      phone: body.phone ? body.phone.trim() : undefined, // Asegurar que se guarde el teléfono
      slug: body.slug.trim(),
      customerId: body.customerId, // Se usa para crear el Profile del dueño y el UsuarioSas administrador
      subscriptionPlanId: body.subscriptionPlanId || undefined,
      subscriptionStatus: body.subscriptionStatus || undefined,
      subscriptionStartDate: body.subscriptionStartDate ? new Date(body.subscriptionStartDate) : undefined,
      subscriptionEndDate: body.subscriptionEndDate ? new Date(body.subscriptionEndDate) : undefined,
      settings: body.settings || undefined,
    })

    return NextResponse.json({ 
      success: true,
      organization: newOrganization,
      message: 'Organización creada exitosamente' 
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_ORGANIZATION' }))
  }
}

