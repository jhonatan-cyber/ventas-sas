import { NextRequest, NextResponse } from 'next/server'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

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
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const cashRegister = await CashRegisterService.getCashRegisterById(id)

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la caja pertenece a la organización
    if (cashRegister.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(cashRegister)
  } catch (error) {
    console.error('Error al obtener caja:', error)
    return NextResponse.json(
      { error: 'Error al obtener la caja' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar caja
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la caja existe y pertenece a la organización
    const existingCashRegister = await CashRegisterService.getCashRegisterById(id)
    if (!existingCashRegister || existingCashRegister.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    // Si se trata de abrir o cerrar la caja, usar métodos específicos
    if (body.action === 'open') {
      if (body.openingBalance === undefined || body.openingBalance === null) {
        return NextResponse.json(
          { error: 'El balance inicial es requerido para abrir la caja' },
          { status: 400 }
        )
      }
      const openingBalance = Number(body.openingBalance)
      if (isNaN(openingBalance) || openingBalance < 0) {
        return NextResponse.json(
          { error: 'El balance inicial debe ser un número válido' },
          { status: 400 }
        )
      }
      const cashRegister = await CashRegisterService.openCashRegister(id, openingBalance)
      return NextResponse.json(cashRegister)
    }

    if (body.action === 'close') {
      const cashRegister = await CashRegisterService.closeCashRegister(id)
      return NextResponse.json(cashRegister)
    }

    // Actualización normal
    const payload = {
      name: body.name?.trim(),
      branchId: body.branchId?.trim(),
      openingBalance: body.openingBalance !== undefined ? Number(body.openingBalance) : undefined,
      currentBalance: body.currentBalance !== undefined ? Number(body.currentBalance) : undefined,
      isOpen: body.isOpen,
    }

    const cashRegister = await CashRegisterService.updateCashRegister(id, payload)

    return NextResponse.json(cashRegister)
  } catch (error: any) {
    console.error('Error al actualizar caja:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la caja' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que la caja existe y pertenece a la organización
    const existingCashRegister = await CashRegisterService.getCashRegisterById(id)
    if (!existingCashRegister || existingCashRegister.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar cajas abiertas
    if (existingCashRegister.isOpen) {
      return NextResponse.json(
        { error: 'No se puede eliminar una caja abierta. Ciérrela primero.' },
        { status: 400 }
      )
    }

    await CashRegisterService.deleteCashRegister(id)

    return NextResponse.json({ message: 'Caja eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar caja:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la caja' },
      { status: 500 }
    )
  }
}

