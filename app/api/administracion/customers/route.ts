import { NextRequest, NextResponse } from 'next/server'
import { CustomerAdminService } from '@/lib/services/admin/customer-admin-service'
import { createCustomerSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener todos los clientes con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined

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

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentAdminUser(request)

    const newCustomer = await CustomerAdminService.createCustomer({
      razonSocial: validatedData.razonSocial || undefined,
      nit: validatedData.nit || undefined,
      ci: validatedData.ci,
      nombre: validatedData.nombre || undefined,
      apellido: validatedData.apellido || undefined,
      direccion: validatedData.direccion || undefined,
      telefono: validatedData.telefono || undefined,
      email: validatedData.email || undefined
    })

    // Registrar creación de cliente en auditoría
    if (currentUser) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          customerId: newCustomer.id,
          actionType: 'SENSITIVE_DATA_ACCESSED', // O crear un nuevo tipo 'CUSTOMER_CREATED'
          entityType: 'Customer',
          entityId: newCustomer.id,
          details: {
            razonSocial: newCustomer.razonSocial,
            slug: newCustomer.slug,
            nit: newCustomer.nit,
            ci: newCustomer.ci,
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

