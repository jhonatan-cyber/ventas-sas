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

    const body = await request.json()
    const question: string = body?.question
    const history = (body?.history || []) as Array<{ role: "user" | "assistant"; content: string }>

    if (!question || question.trim().length === 0) {
      throw AppError.validation("La pregunta es obligatoria")
    }

    const dateRange =
      body?.dateRange && body.dateRange.start && body.dateRange.end
        ? {
            start: new Date(body.dateRange.start),
            end: new Date(body.dateRange.end),
          }
        : undefined

    const answer = await AnalyticsAIService.answerQuestion(organizationId, question, history, dateRange)

    return NextResponse.json({ success: true, data: { answer } })
  } catch (error) {
    return handleApiError(
      error,
      createErrorContext(request, {
        action: "ASK_ANALYTICS_QUESTION",
      })
    )
  }
}


