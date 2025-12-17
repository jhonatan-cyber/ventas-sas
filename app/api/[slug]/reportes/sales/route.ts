import { NextRequest, NextResponse } from "next/server"

import { ReportsService } from "@/lib/services/sales/reports-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      )
    }

    // Parsear filtros opcionales
    const startDateStr = searchParams.get("Start Date")
    const endDateStr = searchParams.get("End Date")
    const paymentMethodParam = searchParams.get("Payment Method")
    const branchIdParam = searchParams.get("Branch Id")
    const userIdParam = searchParams.get("User Id")

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    const paymentMethod =
      paymentMethodParam && ["cash", "card", "transfer", "qr"].includes(paymentMethodParam)
        ? (paymentMethodParam as "cash" | "card" | "transfer" | "qr")
        : undefined

    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : undefined
    const userId = userIdParam && userIdParam !== "all" ? userIdParam : undefined

    const report = await ReportsService.getSalesReport(organizationId, startDate, endDate, {
      paymentMethod,
      branchId,
      userId,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating sales report:", error)
    return NextResponse.json(
      { error: "Error al generar el reporte de ventas" },
      { status: 500 }
    )
  }
}

