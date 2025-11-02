import { NextRequest, NextResponse } from 'next/server'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

function serializeCashRegister(register: any) {
  return {
    ...register,
    openingBalance: Number(register.openingBalance ?? 0),
    currentBalance: Number(register.currentBalance ?? 0),
    lastOpenAt: register.lastOpenAt ? register.lastOpenAt.toISOString() : null,
    lastCloseAt: register.lastCloseAt ? register.lastCloseAt.toISOString() : null,
    createdAt: register.createdAt ? register.createdAt.toISOString() : null,
    updatedAt: register.updatedAt ? register.updatedAt.toISOString() : null,
    branch: register.branch || null,
    openedBy: register.openedBy
      ? {
          id: register.openedBy.id,
          nombre: register.openedBy.nombre,
          apellido: register.openedBy.apellido,
        }
      : null,
    closedBy: register.closedBy
      ? {
          id: register.closedBy.id,
          nombre: register.closedBy.nombre,
          apellido: register.closedBy.apellido,
        }
      : null,
  }
}

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

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
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
      cashRegisters: cashRegisters.map(serializeCashRegister),
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

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const name = (body.name || '').trim()
    const branchId = body.branchId?.trim() || undefined
    const openingBalance = Number(body.openingBalance ?? 0)

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const cashRegister = await CashRegisterService.createCashRegister(organizationId, {
      name,
      branchId,
      openingBalance: isNaN(openingBalance) ? 0 : openingBalance,
      openedById: currentUser.id,
    })

    return NextResponse.json(serializeCashRegister(cashRegister), { status: 201 })
  } catch (error: any) {
    console.error('Error al crear caja:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la caja' },
      { status: 500 }
    )
  }
}

