import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { serializeCashRegister } from '@/lib/utils/serializers'

// GET - Obtener caja por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const cashRegister = await CashRegisterService.getCashRegisterById(id)

    if (!cashRegister) {
      throw AppError.notFound('Caja no encontrada')
    }

    // Verificar que la caja pertenece a la organización
    if (cashRegister.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(serializeCashRegister(cashRegister))
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_CASH_REGISTER', cashRegisterId: id }))
  }
}

// PUT - Actualizar caja
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  let currentUser: any = null
  
  try {
    const { slug, id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const token = request.cookies.get('sas-auth-token')?.value
    currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      throw AppError.unauthorized('No autenticado')
    }

    // Verificar que la caja existe y pertenece a la organización
    const existingCashRegister = await CashRegisterService.getCashRegisterById(id)
    if (!existingCashRegister || existingCashRegister.organizationId !== organizationId) {
      throw AppError.notFound('Caja no encontrada')
    }

    // Si se trata de abrir o cerrar la caja, usar métodos específicos
    if (body.action === 'open') {
      if (body.openingBalance === undefined || body.openingBalance === null) {
        throw AppError.validation('El balance inicial es requerido para abrir la caja')
      }
      const openingBalance = Number(body.openingBalance)
      if (isNaN(openingBalance) || openingBalance < 0) {
        throw AppError.validation('El balance inicial debe ser un número válido')
      }
      
      // Verificar si el usuario es administrador
      const isAdmin = (currentUser as any).rol?.nombre?.toLowerCase() === 'administrador' || 
                     (currentUser as any).rol?.name?.toLowerCase() === 'administrador'
      
      // Obtener sucursal del usuario
      const userBranchId = (currentUser as any).sucursalId || (currentUser as any).sucursal?.id || null
      
      // Si el usuario NO es administrador, validar que solo pueda abrir cajas de su sucursal
      if (!isAdmin && existingCashRegister.branchId && existingCashRegister.branchId !== userBranchId) {
        throw AppError.forbidden('No tienes permiso para abrir cajas de otras sucursales')
      }
      
      // Validar que no haya otra caja abierta para esta sucursal
      if (existingCashRegister.branchId) {
        const existingOpenCashRegister = await CashRegisterService.getAllCashRegisters(
          organizationId,
          0,
          10,
          undefined,
          existingCashRegister.branchId,
          true // isOpen = true
        )
        
        // Verificar que no haya otra caja abierta (excluyendo la actual)
        const otherOpenCashRegister = existingOpenCashRegister.cashRegisters.find(
          cr => cr.id !== id && cr.isOpen
        )
        
        if (otherOpenCashRegister) {
          throw AppError.validation(`Ya existe una caja abierta para esta sucursal. Debe cerrarla antes de abrir esta caja.`)
        }
      }
      
      const cashRegister = await CashRegisterService.openCashRegister(id, openingBalance, currentUser.id)
      return NextResponse.json(serializeCashRegister(cashRegister))
    }

    if (body.action === 'close') {
      const cashRegister = await CashRegisterService.closeCashRegister(id, currentUser.id)
      return NextResponse.json(serializeCashRegister(cashRegister))
    }

    // Verificar si el usuario es administrador
    const isAdmin = (currentUser as any).rol?.nombre?.toLowerCase() === 'administrador' || 
                   (currentUser as any).rol?.name?.toLowerCase() === 'administrador'
    
    // Obtener sucursal del usuario (puede estar en sucursalId o en la relación sucursal)
    const userBranchId = (currentUser as any).sucursalId || (currentUser as any).sucursal?.id || null
    
    // Si el usuario NO es administrador, validar que no intente cambiar la sucursal
    if (!isAdmin && body.branchId && body.branchId !== userBranchId) {
      throw AppError.forbidden('No tienes permiso para asignar una sucursal diferente a la tuya')
    }

    // Determinar branchId final
    let finalBranchId: string | null | undefined = undefined
    if (!isAdmin && userBranchId) {
      // Usuario no admin: usar su sucursal
      finalBranchId = userBranchId
    } else if (isAdmin) {
      // Admin: permitir selección
      finalBranchId = body.branchId?.trim() || undefined
    } else {
      finalBranchId = body.branchId?.trim() || undefined
    }
    
    // Validar que no haya una caja abierta para esta sucursal (si se está cambiando la sucursal)
    if (finalBranchId && finalBranchId !== existingCashRegister.branchId) {
      const existingOpenCashRegister = await CashRegisterService.getAllCashRegisters(
        organizationId,
        0,
        1,
        undefined,
        finalBranchId,
        true // isOpen = true
      )
      
      if (existingOpenCashRegister.cashRegisters.length > 0) {
        throw AppError.validation(`Ya existe una caja abierta para esta sucursal. Debe cerrarla antes de asignar esta caja a esa sucursal.`)
      }
    }

    // Actualización normal
    const payload = {
      name: body.name?.trim(),
      branchId: finalBranchId ?? undefined,
      openingBalance: body.openingBalance !== undefined ? Number(body.openingBalance) : undefined,
      currentBalance: body.currentBalance !== undefined ? Number(body.currentBalance) : undefined,
      isOpen: body.isOpen,
    }

    const cashRegister = await CashRegisterService.updateCashRegister(id, payload)

    return NextResponse.json(serializeCashRegister(cashRegister))
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_CASH_REGISTER', cashRegisterId: id, userId: currentUser?.id }))
  }
}

// DELETE - Eliminar caja
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que la caja existe y pertenece a la organización
    const existingCashRegister = await CashRegisterService.getCashRegisterById(id)
    if (!existingCashRegister || existingCashRegister.organizationId !== organizationId) {
      throw AppError.notFound('Caja no encontrada')
    }

    // No permitir eliminar cajas abiertas
    if (existingCashRegister.isOpen) {
      throw AppError.validation('No se puede eliminar una caja abierta. Ciérrela primero.')
    }

    await CashRegisterService.deleteCashRegister(id)

    return NextResponse.json({ message: 'Caja eliminada correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_CASH_REGISTER', cashRegisterId: id }))
  }
}

