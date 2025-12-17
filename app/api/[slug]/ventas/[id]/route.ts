import { SalePaymentMethod, SaleStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { PERMISSIONS } from '@/lib/config/sas-permissions'
import { prisma } from '@/lib/prisma'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { SaleService, UpdateSaleData } from '@/lib/services/sales/sale-service'
import { getOrCreateOrganizationForCustomer } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'
import { serializeSale } from '@/lib/utils/serializers'
// import { translateText } from '@/lib/utils/translatable-text' - removed

async function ensureSalesUser(organizationId: string, sasUser: any) {
  if (!sasUser) return null

  let salesUser = await prisma.salesUser.findFirst({
    where: {
      organizationId,
      email: sasUser.email || undefined,
    },
  })

  if (!salesUser) {
    salesUser = await prisma.salesUser.create({
      data: {
        organizationId,
        email: sasUser.email || `${sasUser.nombre.toLowerCase()}.${sasUser.apellido.toLowerCase()}@ventas.local`,
        password: sasUser.password || 'temp',
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

    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'No se pudo obtener o crear la organización para el cliente' }, { status: 404 })
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
    // Verificar permiso de editar ventas
    await requirePermission(request, slug, PERMISSIONS.VENTAS_EDITAR)
    const body = await request.json()

    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'No se pudo obtener o crear la organización para el cliente' }, { status: 404 })
    }

    const existingSale = await SaleService.getSaleById(id)
    if (!existingSale || existingSale.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    const token = request.cookies.get("sas-auth-token")?.value
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

    const normalizeSaleStatus = (value?: unknown): SaleStatus | undefined => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return (Object.values(SaleStatus) as string[]).includes(trimmed) ? (trimmed as SaleStatus) : undefined
    }

    const normalizePaymentMethod = (value?: unknown): SalePaymentMethod | undefined => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return (Object.values(SalePaymentMethod) as string[]).includes(trimmed) ? (trimmed as SalePaymentMethod) : undefined
    }

    // Notas sin traducción automática
    const notesTranslations = undefined

    const updatePayload: UpdateSaleData = {
      customerId: body.customerId?.trim() || null,
      status: normalizeSaleStatus(body.status),
      paymentMethod: normalizePaymentMethod(body.paymentMethod),
      subtotal: body.subtotal !== undefined ? Number(body.subtotal) : undefined,
      discount: body.discount !== undefined ? Number(body.discount) : undefined,
      total: body.total !== undefined ? Number(body.total) : undefined,
      notes: body.notes?.trim() ?? null,
      notesTranslations,
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
    // Verificar permiso de eliminar ventas
    await requirePermission(request, slug, PERMISSIONS.VENTAS_ELIMINAR)

    // Obtener o crear automáticamente la organización si no existe
    const organizationId = await getOrCreateOrganizationForCustomer(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'No se pudo obtener o crear la organización para el cliente' }, { status: 404 })
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
