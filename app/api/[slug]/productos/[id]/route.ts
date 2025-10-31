import { NextRequest, NextResponse } from 'next/server'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { getCustomerBySlug } from '@/lib/utils/organization'

// GET - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const product = await SalesProductService.getProductById(id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el producto pertenece al cliente
    if (product.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener el producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const body = await request.json()
    const { categoryId, name, description, brand, model, price, cost, stock, minStock, sku, barcode, imageUrl, isActive } = body

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el producto existe y pertenece al cliente
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const product = await SalesProductService.updateProduct(id, {
      categoryId,
      name,
      description,
      brand,
      model,
      price: price !== undefined ? Number(price) : undefined,
      cost: cost !== undefined ? Number(cost) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      minStock: minStock !== undefined ? Number(minStock) : undefined,
      sku,
      barcode,
      imageUrl,
      isActive
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el producto' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el producto existe y pertenece al cliente
    const existingProduct = await SalesProductService.getProductById(id)
    if (!existingProduct || existingProduct.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    await SalesProductService.deleteProduct(id)
    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el producto' },
      { status: 500 }
    )
  }
}

