import { NextRequest, NextResponse } from 'next/server'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { getCustomerBySlug } from '@/lib/utils/organization'
import { updateProductSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { logBusinessOperation, getRequestContext } from '@/lib/utils/logger'

// GET - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    const product = await SalesProductService.getProductById(id)
    
    if (!product) {
      throw AppError.notFound('Producto no encontrado')
    }

    // Verificar que el producto pertenece al cliente
    if (product.customerId !== customer.id) {
      throw AppError.forbidden('No autorizado')
    }

    return NextResponse.json(product)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_PRODUCT', productId: id }))
  }
}

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que el producto existe y pertenece al cliente
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.customerId !== customer.id) {
      throw AppError.notFound('Producto no encontrado')
    }

    // Parsear y validar body
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }

    // Validar datos con Zod
    const validation = await validateRequestBody(updateProductSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    const product = await SalesProductService.updateProduct(id, {
      categoryId: validatedData.categoryId || undefined,
      name: validatedData.name || undefined,
      description: validatedData.description !== undefined ? validatedData.description : undefined,
      brand: validatedData.brand || undefined,
      model: validatedData.model || undefined,
      price: validatedData.price !== undefined ? validatedData.price : undefined,
      cost: validatedData.cost !== undefined ? validatedData.cost : undefined,
      stock: validatedData.stock !== undefined ? validatedData.stock : undefined,
      minStock: validatedData.minStock !== undefined ? validatedData.minStock : undefined,
      sku: validatedData.sku || undefined,
      barcode: validatedData.barcode || undefined,
      imageUrl: validatedData.imageUrl || undefined,
      isActive: validatedData.isActive !== undefined ? validatedData.isActive : undefined
    })

    return NextResponse.json(product)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_PRODUCT', productId: id }))
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      throw AppError.notFound('Cliente no encontrado o inactivo')
    }

    // Verificar que el producto existe y pertenece al cliente
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.customerId !== customer.id) {
      throw AppError.notFound('Producto no encontrado')
    }

    await SalesProductService.deleteProduct(id)
    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_PRODUCT', productId: id }))
  }
}

