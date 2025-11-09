import { NextRequest, NextResponse } from 'next/server'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { createUsuarioSasSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

// GET - Obtener todos los usuarios con paginación y filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const rolId = searchParams.get('rolId') || undefined
    const sucursalId = searchParams.get('sucursalId') || undefined

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

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentSasUser(request, slug)

    const newUsuario = await UsuarioSasService.createUsuario(organizationId, {
      ci: validatedData.ci || undefined,
      nombre: validatedData.nombre,
      apellido: validatedData.apellido,
      direccion: validatedData.direccion || undefined,
      telefono: validatedData.telefono || undefined,
      correo: validatedData.correo || undefined,
      contraseña: validatedData.contraseña || undefined,
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
            newUserEmail: newUsuario.correo,
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

