import { NextRequest, NextResponse } from "next/server"

import { AppError } from "@/lib/errors/app-error"
import { AnalyticsAIService } from "@/lib/services/analytics/analytics-ai-service"
import { handleApiError, createErrorContext } from "@/lib/utils/error-handler"
import { getCurrentSasUser } from "@/lib/utils/get-current-user"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const user = await getCurrentSasUser(request, slug)

    if (!user) {
      throw AppError.unauthorized("No autenticado")
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound("Organización no encontrada")
    }

    const body = await request.json().catch(() => ({}))
    const dateRange =
      body?.dateRange && body.dateRange.start && body.dateRange.end
        ? {
            start: new Date(body.dateRange.start),
            end: new Date(body.dateRange.end),
          }
        : undefined

    const report = await AnalyticsAIService.generateReport(organizationId, dateRange)

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return handleApiError(
      error,
      createErrorContext(request, {
        action: "GENERATE_ANALYTICS_REPORT",
      })
    )
  }
}


