import { NextRequest, NextResponse } from "next/server"

import { ReportAIService, BasicReportType } from "@/lib/services/sales/report-ai-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

const ALLOWED_TYPES: BasicReportType[] = ["general", "sales", "products", "expenses"]

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const organizationId = await getOrganizationIdByCustomerSlug(slug)

    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const typeParam = (searchParams.get("Type") || "").toLowerCase() as BasicReportType

    if (!ALLOWED_TYPES.includes(typeParam)) {
      return NextResponse.json(
        { error: "Tipo de reporte no soportado" },
        { status: 400 }
      )
    }

    const startDateStr = searchParams.get("Start Date")
    const endDateStr = searchParams.get("End Date")

    const dateRange =
      startDateStr || endDateStr
        ? {
            start: startDateStr ? new Date(startDateStr) : undefined,
            end: endDateStr ? new Date(endDateStr) : undefined,
          }
        : undefined

    const data = await ReportAIService.generateSummary(organizationId, typeParam, dateRange)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("AI summary report error:", error)
    return NextResponse.json(
      { error: "No se pudo generar el resumen inteligente" },
      { status: 500 }
    )
  }
}


