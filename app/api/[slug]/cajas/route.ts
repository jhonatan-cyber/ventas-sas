import { NextRequest, NextResponse } from 'next/server'

import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { CashRegisterService } from '@/lib/services/sales/cash-register-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'
import { serializeCashRegister } from '@/lib/utils/serializers'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createCashRegisterSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todas las cajas con paginación y filtros
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
    const branchId = searchParams.get("Branch Id") || undefined
    const isOpen = searchParams.get("Is Open") === 'true' ? true : searchParams.get("Is Open") === 'false' ? false : undefined

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar permiso para gestionar cajas
    await requirePermission(request, slug, EXTRA_PERMISSIONS.CAJAS_MANAGE)

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
    return handleApiError(error, createErrorContext(request, { action: 'GET_CASH_REGISTERS' }))
  }
}

// POST - Crear nueva caja
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let currentUser: any = null
  
  try {
    const { slug } = await params

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!customer || !organizationId) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar permiso para crear/gestionar cajas
    await requirePermission(request, slug, EXTRA_PERMISSIONS.CAJAS_MANAGE)

    const token = request.cookies.get("sas-auth-token")?.value
    currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      throw AppError.unauthorized('No autenticado')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(createCashRegisterSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Verificar si el usuario es administrador
    const isAdmin = (currentUser as any).rol?.nombre?.toLowerCase() === 'administrador' || 
                   (currentUser as any).rol?.name?.toLowerCase() === 'administrador'
    
    // Obtener sucursal del usuario (puede estar en sucursalId o en la relación sucursal)
    const userBranchId = (currentUser as any).sucursalId || (currentUser as any).sucursal?.id || null
    
    // Determinar branchId final
    let finalBranchId: string | undefined = undefined
    
    if (!isAdmin && userBranchId) {
      // Usuario NO administrador: usar su sucursal automáticamente
      finalBranchId = userBranchId
    } else if (isAdmin) {
      // Usuario administrador: permitir selección manual de sucursal
      finalBranchId = validatedData.branchId || undefined
    } else {
      // Por defecto: sin sucursal (solo si no hay sucursal asignada al usuario)
      finalBranchId = undefined
    }
    
    // Validar que no haya una caja abierta para esta sucursal
    if (finalBranchId) {
      const existingOpenCashRegister = await CashRegisterService.getAllCashRegisters(
        organizationId,
        0,
        1,
        undefined,
        finalBranchId,
        true // isOpen = true
      )
      
      if (existingOpenCashRegister.cashRegisters.length > 0) {
        throw AppError.validation(`Ya existe una caja abierta para esta sucursal. Debe cerrarla antes de crear una nueva.`)
      }
    }

    const cashRegister = await CashRegisterService.createCashRegister(organizationId, {
      name: validatedData.name,
      branchId: finalBranchId,
      openingBalance: validatedData.openingBalance || 0,
      openedById: currentUser.id,
    })

    return NextResponse.json(serializeCashRegister(cashRegister), { status: 201 })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { 
      action: 'CREATE_CASH_REGISTER',
      userId: currentUser?.id 
    }))
  }
}

