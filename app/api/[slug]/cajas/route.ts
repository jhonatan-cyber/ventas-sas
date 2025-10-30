import { NextRequest, NextResponse } from 'next/server'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener todas las cajas con paginación y filtros
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
    const branchId = searchParams.get('branchId') || undefined
    const isOpen = searchParams.get('isOpen') === 'true' ? true : searchParams.get('isOpen') === 'false' ? false : undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * pageSize

    const { cashRegisters, total } = await CashRegisterService.getAllCashRegisters(
      organizationId,
      skip,
      pageSize,
      search,
      branchId,
      isOpen
    )

    return NextResponse.json({
      cashRegisters,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener cajas:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cajas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva caja
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const cashRegister = await CashRegisterService.createCashRegister(organizationId, {
      name: body.name.trim(),
      branchId: body.branchId,
      openingBalance: body.openingBalance || 0
    })

    return NextResponse.json(cashRegister, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear caja:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la caja' },
      { status: 500 }
    )
  }
}

