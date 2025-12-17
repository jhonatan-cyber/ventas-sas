import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { CustomerAdminService } from '@/lib/services/admin/customer-admin-service'
import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createCustomerSchema } from '@/lib/validators/admin-validators'

// GET - Obtener todos los clientes con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para listar clientes
    const canList = await PermissionCheckService.hasActivePermission(currentUser.id, 'clientes_listar')
    if (!canList) {
      return NextResponse.json({ error: 'No tiene permiso para listar clientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("Page") || '1')
    const pageSize = parseInt(searchParams.get("Page Size") || '10')
    const search = searchParams.get("Search") || undefined
    const status = searchParams.get("Status") || undefined

    const skip = (page - 1) * pageSize

    const { customers, total } = await CustomerAdminService.getAllCustomers(skip, pageSize, search, status)

    return NextResponse.json({
      customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_CUSTOMERS_ADMIN' }))
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para crear clientes
    const canCreate = await PermissionCheckService.hasActivePermission(currentUser.id, 'clientes_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No tiene permiso para crear clientes' }, { status: 403 })
    }
    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createCustomerSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const newCustomer = await CustomerAdminService.createCustomer({
      ci: validatedData.ci,
      nombre: validatedData.nombre || undefined,
      apellido: validatedData.apellido || undefined,
      address: validatedData.address || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined
    })

    // Obtener el cliente con las propiedades extendidas para auditoría
    const customerWithDetails = await CustomerAdminService.getCustomerById(newCustomer.id)

    // Registrar creación de cliente en auditoría
    if (currentUser && customerWithDetails) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          customerId: newCustomer.id,
          actionType: 'SENSITIVE_DATA_ACCESSED', // O crear un nuevo tipo 'CUSTOMER_CREATED'
          entityType: 'Customer',
          entityId: newCustomer.id,
          details: {
            slug: customerWithDetails.slug,
            ci: customerWithDetails.ci,
          },
        },
        request
      )
    }

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_CUSTOMER_ADMIN' }))
  }
}

