import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Verificar sesión
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("sas-session")
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let session: any = null
    try {
      const value = sessionCookie.value
      let decoded: string
      try {
        decoded = Buffer.from(value, 'base64').toString('utf8')
        session = JSON.parse(decoded)
      } catch {
        session = JSON.parse(value)
      }
    } catch {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Verificar que la sesión corresponde a la organización correcta
    if (session.organizationSlug !== slug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    const userId = session.userId
    if (!userId) {
      return NextResponse.json({ error: "Usuario no encontrado en sesión" }, { status: 401 })
    }

    // Obtener fechas para el mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Estadísticas de ventas del usuario
    const [
      mySalesThisMonth,
      myTotalSales,
      myRevenueThisMonth,
      myTotalRevenue,
      myPendingQuotations,
      myTotalQuotations,
      recentSales,
      recentQuotations
    ] = await Promise.all([
      // Ventas del mes actual
      prisma.sale.count({
        where: {
          organizationId,
          userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Total de ventas del usuario
      prisma.sale.count({
        where: {
          organizationId,
          userId
        }
      }),

      // Ingresos del mes actual
      prisma.sale.aggregate({
        where: {
          organizationId,
          userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          total: true
        }
      }),

      // Ingresos totales del usuario
      prisma.sale.aggregate({
        where: {
          organizationId,
          userId
        },
        _sum: {
          total: true
        }
      }),

      // Cotizaciones pendientes (todas de la organización, ya que no están asociadas a usuarios)
      prisma.quotation.count({
        where: {
          organizationId,
          status: 'active' // El status es 'active', no 'pending'
        }
      }),

      // Total de cotizaciones (todas de la organización)
      prisma.quotation.count({
        where: {
          organizationId
        }
      }),

      // Ventas recientes del usuario (últimas 5)
      prisma.sale.findMany({
        where: {
          organizationId,
          userId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Cotizaciones recientes (últimas 5 activas de la organización)
      prisma.quotation.findMany({
        where: {
          organizationId,
          status: 'active'
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ])

    const stats = {
      mySalesThisMonth,
      myTotalSales,
      myRevenueThisMonth: Number(myRevenueThisMonth._sum.total || 0),
      myTotalRevenue: Number(myTotalRevenue._sum.total || 0),
      myPendingQuotations,
      myTotalQuotations,
      recentSales: recentSales.map(sale => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: sale.total,
        status: sale.status,
        createdAt: sale.createdAt,
        customer: sale.customer
      })),
      recentQuotations: recentQuotations.map(quotation => ({
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        total: quotation.total,
        status: quotation.status,
        createdAt: quotation.createdAt,
        customer: quotation.customer
      }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Error obteniendo estadísticas del usuario:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}