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

    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    
    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    const report = await ReportsService.getExpensesReport(
      organizationId,
      startDate,
      endDate
    )

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating expenses report:", error)
    return NextResponse.json(
      { error: "Error al generar el reporte de gastos" },
      { status: 500 }
    )
  }
}

