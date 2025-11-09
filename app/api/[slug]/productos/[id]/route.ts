import { NextRequest, NextResponse } from 'next/server'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { updateProductSchema } from '@/lib/validators/sales-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

// GET - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const product = await SalesProductService.getProductById(id)
    
    if (!product) {
      throw AppError.notFound('Producto no encontrado')
    }

    // Verificar que el producto pertenece a la organización
    if (product.organizationId !== organizationId) {
      throw AppError.forbidden('No autorizado')
    }

    // Verificar que el producto pertenece a la sucursal del usuario (si el usuario tiene sucursal y NO es administrador)
    const currentUser = await getCurrentSasUser(request, slug)
    if (currentUser) {
      const userRoleName = currentUser.rol?.nombre?.toLowerCase() || ''
      const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'
      
      // Solo verificar sucursal si NO es administrador
      const productBranchId = (product as any).branchId as string | null | undefined
      if (!isAdmin && currentUser.sucursalId && productBranchId !== currentUser.sucursalId) {
        throw AppError.forbidden('No autorizado: El producto no pertenece a tu sucursal')
      }
    }

    return NextResponse.json(product)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PRODUCT' }))
  }
}

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que el producto existe y pertenece a la organización
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.organizationId !== organizationId) {
      throw AppError.notFound('Producto no encontrado')
    }

    // Verificar que el producto pertenece a la sucursal del usuario (si el usuario tiene sucursal y NO es administrador)
    const currentUser = await getCurrentSasUser(request, slug)
    if (currentUser) {
      const userRoleName = currentUser.rol?.nombre?.toLowerCase() || ''
      const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'
      
      // Solo verificar sucursal si NO es administrador
      const existingProductBranchIdForUpdate = (existingProduct as any).branchId as string | null | undefined
      if (!isAdmin && currentUser.sucursalId && existingProductBranchIdForUpdate !== currentUser.sucursalId) {
        throw AppError.forbidden('No autorizado: El producto no pertenece a tu sucursal')
      }
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

    // Obtener usuario para determinar si puede cambiar branchId
    const currentUserForUpdate = await getCurrentSasUser(request, slug)
    const userRoleNameForUpdate = currentUserForUpdate?.rol?.nombre?.toLowerCase() || ''
    const isAdminForUpdate = userRoleNameForUpdate.includes('administrador') || userRoleNameForUpdate === 'admin'

    const product = await SalesProductService.updateProduct(id, {
      // Solo permitir cambiar branchId si es administrador
      ...(isAdminForUpdate && validatedData.branchId ? { branchId: validatedData.branchId } : {}),
      categoryId: validatedData.categoryId || undefined,
      name: validatedData.name || undefined,
      description: validatedData.description ?? undefined,
      brand: validatedData.brand ?? undefined,
      model: validatedData.model ?? undefined,
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
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_PRODUCT' }))
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que el producto existe y pertenece a la organización
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.organizationId !== organizationId) {
      throw AppError.notFound('Producto no encontrado')
    }

    // Verificar que el producto pertenece a la sucursal del usuario (si el usuario tiene sucursal y NO es administrador)
    const currentUser = await getCurrentSasUser(request, slug)
    if (currentUser) {
      const userRoleName = currentUser.rol?.nombre?.toLowerCase() || ''
      const isAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'
      
      // Solo verificar sucursal si NO es administrador
      const existingProductBranchId = (existingProduct as any).branchId as string | null | undefined
      if (!isAdmin && currentUser.sucursalId && existingProductBranchId !== currentUser.sucursalId) {
        throw AppError.forbidden('No autorizado: El producto no pertenece a tu sucursal')
      }
    }

    await SalesProductService.deleteProduct(id, slug)
    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_PRODUCT' }))
  }
}

