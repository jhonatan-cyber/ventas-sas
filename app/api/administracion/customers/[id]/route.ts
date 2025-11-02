import { NextRequest, NextResponse } from 'next/server'
import { CustomerAdminService } from '@/lib/services/admin/customer-admin-service'
import { updateCustomerSchema } from '@/lib/validators/admin-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener un cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await CustomerAdminService.getCustomerById(id)
    
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado')
    }

    return NextResponse.json(customer)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_ADMIN_CUSTOMER', customerId: id }))
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(updateCustomerSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Obtener usuario actual y cliente objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetCustomer = await CustomerAdminService.getCustomerById(id)

    const updatedCustomer = await CustomerAdminService.updateCustomer(id, {
      razonSocial: validatedData.razonSocial || undefined,
      nit: validatedData.nit || undefined,
      ci: validatedData.ci || undefined,
      nombre: validatedData.nombre || undefined,
      apellido: validatedData.apellido || undefined,
      direccion: validatedData.direccion || undefined,
      telefono: validatedData.telefono || undefined,
      email: validatedData.email || undefined,
      isActive: body.isActive !== undefined ? body.isActive : undefined
    })

    // Registrar actualización de cliente en auditoría
    if (currentUser && targetCustomer) {
      const changedFields: string[] = []
      if (validatedData.razonSocial !== undefined && targetCustomer.razonSocial !== validatedData.razonSocial) {
        changedFields.push('razonSocial')
      }
      if (validatedData.nit !== undefined && targetCustomer.nit !== validatedData.nit) {
        changedFields.push('nit')
      }
      if (body.isActive !== undefined && targetCustomer.isActive !== body.isActive) {
        changedFields.push('isActive')
      }

      if (changedFields.length > 0) {
        await SecurityAuditLogger.logSensitiveAction(
          {
            userId: currentUser.id,
            customerId: id,
            actionType: 'SENSITIVE_DATA_ACCESSED',
            entityType: 'Customer',
            entityId: id,
            details: {
              changedFields,
              slug: targetCustomer.slug,
            },
          },
          request
        )
      }
    }

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_ADMIN_CUSTOMER', customerId: id }))
  }
}

// PATCH - Cambiar estado del cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }
    
    const { isActive } = body

    // Obtener usuario actual y cliente objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetCustomer = await CustomerAdminService.getCustomerById(id)

    const updatedCustomer = await CustomerAdminService.updateCustomer(id, {
      isActive
    })

    // Registrar cambio de estado del cliente en auditoría
    if (currentUser && targetCustomer) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          customerId: id,
          actionType: 'SENSITIVE_DATA_ACCESSED',
          entityType: 'Customer',
          entityId: id,
          details: {
            action: isActive ? 'activated' : 'deactivated',
            slug: targetCustomer.slug,
          },
        },
        request
      )
    }

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'PATCH_ADMIN_CUSTOMER', customerId: id }))
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener usuario actual y cliente objetivo para auditoría
    const currentUser = await getCurrentAdminUser(request)
    const targetCustomer = await CustomerAdminService.getCustomerById(id)

    await CustomerAdminService.deleteCustomer(id)

    // Registrar eliminación de cliente en auditoría
    if (currentUser && targetCustomer) {
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: currentUser.id,
          customerId: id,
          actionType: 'SENSITIVE_DATA_ACCESSED',
          entityType: 'Customer',
          entityId: id,
          details: {
            action: 'deleted',
            razonSocial: targetCustomer.razonSocial,
            slug: targetCustomer.slug,
          },
        },
        request
      )
    }

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_ADMIN_CUSTOMER', customerId: id }))
  }
}

