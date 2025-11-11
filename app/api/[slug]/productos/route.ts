import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { requireCSRF } from '@/lib/utils/csrf-protection'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { logBusinessOperation } from '@/lib/utils/logger'
import { getOrganizationIdByCustomerSlug, getMaxProductsByOrganizationId } from '@/lib/utils/organization'
import { getRequestContext } from '@/lib/utils/request-context'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { createProductSchema } from '@/lib/validators/sales-validators'

// GET - Obtener todos los productos con paginación y filtros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const requestContext = getRequestContext(request)
  
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const queryBranchId = searchParams.get('branchId') || undefined

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Obtener usuario logueado para filtrar por sucursal
    const currentUser = await getCurrentSasUser(request, slug)
    
    // Verificar si el usuario es administrador
    const userRoleName = currentUser?.rol?.nombre?.toLowerCase() || ''
    const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'
    
    // Solo filtrar por sucursal si NO es administrador
    const branchId = isAdmin
      ? (queryBranchId && queryBranchId !== 'null' ? queryBranchId : undefined)
      : (currentUser?.sucursalId || undefined)

    const skip = (page - 1) * pageSize

    const { products, total } = await SalesProductService.getAllProducts(
      organizationId,
      skip,
      pageSize,
      search,
      status,
      categoryId,
      branchId // Filtrar por sucursal solo si no es administrador
    )

    const duration = Date.now() - startTime
    const response = NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
    
    // Agregar correlation ID a headers
    response.headers.set('X-Correlation-ID', requestContext.correlationId)
    response.headers.set('X-Response-Time', `${duration}ms`)
    
    return response
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PRODUCTS' }))
  }
}

// POST - Crear nuevo producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const requestContext = getRequestContext(request)
  
  try {
    // Validar CSRF token (solo si está habilitado)
    if (process.env.ENABLE_CSRF === 'true') {
      requireCSRF(request)
    }

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
    const validation = await validateRequestBody(createProductSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Verificar límite de productos del plan
    const maxProducts = await getMaxProductsByOrganizationId(organizationId)
    if (maxProducts !== null) {
      // Contar productos existentes (activos e inactivos, pero no eliminados)
      // Sin filtros de categoría o sucursal para obtener el total de la organización
      const { total: currentProductsCount } = await SalesProductService.getAllProducts(
        organizationId,
        0,
        1000, // Obtener todas para contar
        undefined, // sin búsqueda
        undefined, // sin filtro de estado
        undefined, // sin filtro de categoría
        undefined, // sin filtro de sucursal
        false // includeDeleted: false, no contar eliminados
      )

      if (currentProductsCount >= maxProducts) {
        throw AppError.validation(
          `Has alcanzado el límite de productos permitidos en tu plan (${maxProducts}). ` +
          `Por favor, actualiza tu plan para crear más productos.`
        )
      }
    }

    // Obtener usuario logueado para asignar sucursal al producto
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }
    
    // Verificar si el usuario es administrador
    const userRoleName = currentUser.rol?.nombre?.toLowerCase() || ""
    const isAdmin = userRoleName.includes("administrador") || userRoleName === "admin"
    
    // Si es administrador, puede usar el branchId del body, si no, usar el del usuario
    let branchId: string | undefined
    if (isAdmin && validatedData.branchId) {
      // Verificar que la sucursal pertenece a la organización
      const branch = await prisma.branch.findFirst({
        where: {
          id: validatedData.branchId,
          organizationId: organizationId
        }
      })
      if (!branch) {
        throw AppError.validation('La sucursal seleccionada no pertenece a la organización')
      }
      branchId = validatedData.branchId
    } else {
      // Si no es admin o no se envió branchId, usar la sucursal del usuario
      branchId = currentUser.sucursalId || undefined
      if (!branchId) {
        throw AppError.validation('El usuario debe tener una sucursal asignada para crear productos')
      }
    }

    // Validar que categoryId esté presente
    if (!validatedData.categoryId) {
      throw AppError.validation('La categoría es requerida')
    }

    const newProduct = await SalesProductService.createProduct(organizationId, {
      branchId, // Asignar sucursal del usuario logueado o seleccionada por admin
      categoryId: validatedData.categoryId,
      name: validatedData.name,
      description: validatedData.description || undefined,
      brand: validatedData.brand || undefined,
      model: validatedData.model || undefined,
      price: validatedData.price ?? 0,
      cost: validatedData.cost ?? 0,
      stock: validatedData.stock ?? 0,
      minStock: validatedData.minStock ?? 0,
      sku: validatedData.sku || undefined,
      barcode: validatedData.barcode || undefined,
      imageUrl: validatedData.imageUrl || undefined
    })

    // Log de operación de negocio
    logBusinessOperation('CREATE', 'Product', newProduct.id, undefined, {
      correlationId: requestContext.correlationId,
      organizationId: organizationId,
      productName: newProduct.name,
      slug,
    })

    const duration = Date.now() - startTime
    const response = NextResponse.json(newProduct, { status: 201 })
    response.headers.set('X-Correlation-ID', requestContext.correlationId)
    response.headers.set('X-Response-Time', `${duration}ms`)
    
    return response
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'CREATE_PRODUCT' }))
  }
}

