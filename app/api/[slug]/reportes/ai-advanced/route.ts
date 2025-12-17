import { NextRequest, NextResponse } from "next/server"

import { ReportAIService } from "@/lib/services/sales/report-ai-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get("Start Date")
    const endDateStr = searchParams.get("End Date")

    const dateRange =
      startDateStr || endDateStr
        ? {
            start: startDateStr ? new Date(startDateStr) : undefined,
            end: endDateStr ? new Date(endDateStr) : undefined,
          }
        : undefined

    const data = await ReportAIService.generateAdvancedReport(organizationId, dateRange)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("AI advanced report error:", error)
    return NextResponse.json(
      { error: "No se pudo generar el reporte avanzado con IA" },
      { status: 500 }
    )
  }
}


