import { NextRequest, NextResponse } from 'next/server'
import { SaleService, UpdateSaleData } from '@/lib/services/sales/sale-service'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
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
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const sale = await SaleService.getSaleById(id)
    if (!sale || sale.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeSale(sale))
  } catch (error) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json({ error: 'Error al obtener la venta' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const existingSale = await SaleService.getSaleById(id)
    if (!existingSale || existingSale.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    const token = request.cookies.get('sas-auth-token')?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (Array.isArray(body.items) && body.items.length === 0) {
      return NextResponse.json({ error: 'La venta debe tener al menos un producto' }, { status: 400 })
    }

    if (Array.isArray(body.items)) {
      await ensureSalesUser(organizationId, currentUser)
    }

    const updatePayload: UpdateSaleData = {
      customerId: body.customerId?.trim() || null,
      status: body.status?.trim(),
      paymentMethod: body.paymentMethod?.trim(),
      subtotal: body.subtotal !== undefined ? Number(body.subtotal) : undefined,
      discount: body.discount !== undefined ? Number(body.discount) : undefined,
      total: body.total !== undefined ? Number(body.total) : undefined,
      notes: body.notes?.trim() ?? null,
    }

    if (Array.isArray(body.items)) {
      updatePayload.items = body.items.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        trackingCodes: Array.isArray(item.trackingCodes)
          ? item.trackingCodes
              .map((code: any) => (typeof code === 'string' ? code.trim() : ''))
              .filter((code: string) => code.length > 0)
          : [],
      }))
    }

    const sale = await SaleService.updateSale(id, updatePayload)

    return NextResponse.json(serializeSale(sale))
  } catch (error: any) {
    console.error('Error al actualizar venta:', error)
    return NextResponse.json({ error: error.message || 'Error al actualizar la venta' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const existingSale = await SaleService.getSaleById(id)
    if (!existingSale || existingSale.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    await SaleService.deleteSale(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar venta:', error)
    return NextResponse.json({ error: error.message || 'Error al eliminar la venta' }, { status: 500 })
  }
}
