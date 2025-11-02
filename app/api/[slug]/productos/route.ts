import { NextRequest, NextResponse } from 'next/server'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { getCustomerBySlug } from '@/lib/utils/organization'
import { createProductSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { requireCSRF } from '@/lib/utils/csrf-protection'
import { logBusinessOperation } from '@/lib/utils/logger'
import { getRequestContext } from '@/lib/utils/request-context'

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

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const skip = (page - 1) * pageSize

    const { products, total } = await SalesProductService.getAllProducts(
      customer.id,
      skip,
      pageSize,
      search,
      status,
      categoryId
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

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
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

    const newProduct = await SalesProductService.createProduct(customer.id, {
      categoryId: validatedData.categoryId || undefined,
      name: validatedData.name,
      description: validatedData.description || undefined,
      brand: validatedData.brand || undefined,
      model: validatedData.model || undefined,
      price: validatedData.price,
      cost: validatedData.cost,
      stock: validatedData.stock,
      minStock: validatedData.minStock,
      sku: validatedData.sku || undefined,
      barcode: validatedData.barcode || undefined,
      imageUrl: validatedData.imageUrl || undefined
    })

    // Log de operación de negocio
    logBusinessOperation('CREATE', 'Product', newProduct.id, undefined, {
      correlationId: requestContext.correlationId,
      customerId: customer.id,
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

