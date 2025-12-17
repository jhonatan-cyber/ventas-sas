import { NextRequest, NextResponse } from 'next/server'

import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug, getMaxUsersByOrganizationId } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createUsuarioSasSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todos los usuarios con paginación y filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '10')
    const search = searchParams.get("Search") || undefined
    const status = searchParams.get("Status") || undefined
    const rolId = searchParams.get("Rol Id") || undefined
    const sucursalId = searchParams.get("Sucursal Id") || undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const skip = (page - 1) * pageSize

    const { usuarios, total } = await UsuarioSasService.getAllUsuarios(
      organizationId,
      skip,
      pageSize,
      search,
      status,
      rolId,
      sucursalId
    )

    return NextResponse.json({
      usuarios,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_USUARIOS' }))
  }
}

// POST - Crear nuevo usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar permiso para crear usuarios
    await requirePermission(request, slug, EXTRA_PERMISSIONS.USUARIOS_CREAR)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createUsuarioSasSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Verificar límite de usuarios del plan
    const maxUsers = await getMaxUsersByOrganizationId(organizationId)
    if (maxUsers !== null) {
      // Contar usuarios existentes (activos e inactivos, pero no eliminados)
      const { total: currentUsersCount } = await UsuarioSasService.getAllUsuarios(
        organizationId,
        0,
        1000, // Obtener todas para contar
        undefined,
        undefined,
        undefined,
        undefined,
        false // includeDeleted: false, no contar eliminados
      )

      if (currentUsersCount >= maxUsers) {
        throw AppError.validation(
          `Has alcanzado el límite de usuarios permitidos en tu plan (${maxUsers}). ` +
          `Por favor, actualiza tu plan para crear más usuarios.`
        )
      }
    }

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentSasUser(request, slug)

    const newUsuario = await UsuarioSasService.createUsuario(organizationId, {
      ci: validatedData.ci || undefined,
      nombre: validatedData.nombre,
      apellido: validatedData.apellido,
      address: validatedData.address || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined,
      password: validatedData.password || undefined,
      rolId: validatedData.rolId || undefined,
      foto: validatedData.foto || undefined,
      sucursalId: validatedData.sucursalId || undefined
    })

    // Registrar creación de usuario en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          organizationId: organizationId,
          actionType: 'USER_CREATED',
          entityType: 'UsuarioSas',
          entityId: newUsuario.id,
          details: {
            newUserCi: newUsuario.ci,
            newUserEmail: newUsuario.email,
            rolId: validatedData.rolId,
          },
        },
        request
      )
    }

    return NextResponse.json(newUsuario, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_USUARIO' }))
  }
}

