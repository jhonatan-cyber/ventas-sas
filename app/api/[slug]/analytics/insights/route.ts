import { NextRequest, NextResponse } from "next/server"

import { AnalyticsAIService } from "@/lib/services/analytics/analytics-ai-service"
import { handleApiError, createErrorContext } from "@/lib/utils/error-handler"
import { getCurrentSasUser } from "@/lib/utils/get-current-user"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const user = await getCurrentSasUser(request, slug)

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("Start")
    const end = searchParams.get("End")

    const dateRange =
      start && end
        ? {
            start: new Date(start),
            end: new Date(end),
          }
        : undefined

    const data = await AnalyticsAIService.generateInsights(organizationId, dateRange)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(
      error,
      createErrorContext(request, {
        action: "GET_ANALYTICS_INSIGHTS",
      })
    )
  }
}


