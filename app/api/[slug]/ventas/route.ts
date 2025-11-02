import { NextRequest, NextResponse } from 'next/server'
import { SaleService } from '@/lib/services/sales/sale-service'
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from '@/lib/utils/organization'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { prisma } from '@/lib/prisma'

function serializeSale(sale: any) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal ?? 0),
    discount: Number(sale.discount ?? 0),
    total: Number(sale.total ?? 0),
    createdAt: sale.createdAt ? sale.createdAt.toISOString() : null,
    updatedAt: sale.updatedAt ? sale.updatedAt.toISOString() : null,
    customer: sale.customer
      ? {
          id: sale.customer.id,
          name: sale.customer.name,
          lastName: sale.customer.lastName,
          email: sale.customer.email,
          phone: sale.customer.phone,
        }
      : null,
    user: sale.user
      ? {
          id: sale.user.id,
          fullName: sale.user.fullName,
          email: sale.user.email,
        }
      : null,
    items: sale.items?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      trackingCodes: Array.isArray(item.trackingCodes)
        ? item.trackingCodes.filter((code: any) => typeof code === 'string').map((code: string) => code.trim())
        : [],
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price ?? 0),
            imageUrl: item.product.imageUrl,
          }
        : null,
    })),
  }
}

async function ensureSalesUser(organizationId: string, sasUser: any) {
  if (!sasUser) return null

  let salesUser = await prisma.salesUser.findFirst({
    where: {
      organizationId,
      email: sasUser.correo || undefined,
    },
  })

  if (!salesUser) {
    salesUser = await prisma.salesUser.create({
      data: {
        organizationId,
        email: sasUser.correo || `${sasUser.nombre.toLowerCase()}.${sasUser.apellido.toLowerCase()}@ventas.local`,
        password: sasUser.contraseña || 'temp',
        fullName: `${sasUser.nombre} ${sasUser.apellido}`.trim(),
        isActive: sasUser.isActive,
      },
    })
  }

  return salesUser
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const customer = await getCustomerBySlug(slug)
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!customer || !organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const skip = (page - 1) * pageSize

    const { sales, total } = await SaleService.getAllSales(
      organizationId,
      skip,
      pageSize,
      search ?? undefined,
      status ?? undefined,
      paymentMethod ?? undefined,
      customerId ?? undefined,
      startDate,
      endDate,
    )

    return NextResponse.json({
      sales: sales.map(serializeSale),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json({ error: 'Error al obtener las ventas' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'La venta debe tener al menos un producto' }, { status: 400 })
    }

    const salesUser = await ensureSalesUser(organizationId, currentUser)
    if (!salesUser) {
      return NextResponse.json({ error: 'No se pudo asociar el usuario de ventas' }, { status: 400 })
    }

    const subtotal = Number(body.subtotal ?? 0)
    const discount = Number(body.discount ?? 0)
    const total = Number(body.total ?? 0)

    const sale = await SaleService.createSale(organizationId, {
      userId: salesUser.id,
      customerId: body.customerId?.trim() || null,
      status: body.status?.trim() || 'completed',
      paymentMethod: body.paymentMethod?.trim() || 'cash',
      subtotal,
      discount,
      total,
      notes: body.notes?.trim() || null,
      items: body.items.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        trackingCodes: Array.isArray(item.trackingCodes)
          ? item.trackingCodes
              .map((code: any) => (typeof code === 'string' ? code.trim() : ''))
              .filter((code: string) => code.length > 0)
          : [],
      })),
    })

    return NextResponse.json(serializeSale(sale), { status: 201 })
  } catch (error: any) {
    console.error('Error al crear venta:', error)
    return NextResponse.json({ error: error.message || 'Error al crear la venta' }, { status: 500 })
  }
}
