import { NextRequest, NextResponse } from 'next/server'
import { SalesProductService } from '@/lib/services/sales/sales-product-service'
import { getCustomerBySlug } from '@/lib/utils/organization'

// GET - Obtener todos los productos con paginación y filtros
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
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') || undefined

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
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

    return NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los productos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { categoryId, name, description, brand, model, price, cost, stock, minStock, sku, barcode, imageUrl } = body

    if (!name || price === undefined || cost === undefined) {
      return NextResponse.json(
        { error: 'El nombre, precio y costo son requeridos' },
        { status: 400 }
      )
    }

    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const newProduct = await SalesProductService.createProduct(customer.id, {
      categoryId,
      name,
      description,
      brand,
      model,
      price: Number(price),
      cost: Number(cost),
      stock: stock ? Number(stock) : undefined,
      minStock: minStock ? Number(minStock) : undefined,
      sku,
      barcode,
      imageUrl
    })

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el producto' },
      { status: 500 }
    )
  }
}

