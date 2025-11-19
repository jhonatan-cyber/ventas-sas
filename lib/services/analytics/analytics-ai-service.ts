import { AnalyticsService, KPIData, ProductProfitability, TrendData } from "./analytics-service"

import { chatCompleteWithOptions } from "@/lib/services/ai/provider"


interface DateRangeInput {
  start: Date
  end: Date
}

interface InsightsResponse {
  summary: string
  highlights: string[]
  anomalies: string[]
  recommendations: string[]
  scenarios: Array<{ title: string; description: string; impact: string }>
}

const DEFAULT_INSIGHTS: InsightsResponse = {
  summary: "No se detectaron cambios significativos en el período analizado.",
  highlights: [],
  anomalies: [],
  recommendations: [],
  scenarios: [],
}

export class AnalyticsAIService {
  private static async buildContext(organizationId: string, dateRange?: DateRangeInput) {
    const [kpis, trends, profitability, segments, predictions] = await Promise.all([
      AnalyticsService.getKPIs(organizationId, dateRange),
      AnalyticsService.getSalesTrends(organizationId),
      AnalyticsService.getProductProfitability(organizationId, dateRange),
      AnalyticsService.getCustomerSegmentation(organizationId),
      AnalyticsService.getSalesPredictions(organizationId),
    ])

    return {
      kpis,
      trends,
      profitability,
      segments,
      predictions,
      dateRange: dateRange
        ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        : null,
    }
  }

  private static safeJsonParse<T>(raw: string, fallback: T): T {
    try {
      const trimmed = raw.trim()
      const start = trimmed.indexOf("{")
      const end = trimmed.lastIndexOf("}")
      if (start !== -1 && end !== -1) {
        return JSON.parse(trimmed.slice(start, end + 1))
      }
      return JSON.parse(trimmed)
    } catch {
      return fallback
    }
  }

  private static buildFallbackInsights(kpis: KPIData[], trends: TrendData[], profitability: ProductProfitability[]): InsightsResponse {
    const summaryKpi = kpis.find((kpi) => kpi.id === "total-revenue")
    const fallbackSummary =
      summaryKpi && summaryKpi.changePercent
        ? `Los ingresos totales registraron una variación de ${summaryKpi.changePercent.toFixed(1)}% frente al período anterior.`
        : DEFAULT_INSIGHTS.summary

    const sortedHighlights = [...kpis]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3)
      .map((kpi) => `${kpi.name}: ${kpi.value.toLocaleString()} (${kpi.changePercent.toFixed(1)}% vs período anterior).`)

    const anomalies: string[] = []
    if (trends.length > 2) {
      const recent = trends.slice(-3)
      const avgRecent = recent.reduce((acc, item) => acc + item.value, 0) / recent.length
      const avgAll = trends.reduce((acc, item) => acc + item.value, 0) / trends.length
      if (avgRecent < avgAll * 0.8) {
        anomalies.push("Las ventas recientes se ubicaron un 20% por debajo del promedio del período, revisa campañas y stock disponible.")
      }
    }

    const recommendations: string[] = []
    const lowMarginProduct = profitability.find((product) => product.profitMargin < 15)
    if (lowMarginProduct) {
      recommendations.push(
        `Revisa el precio o los costos del producto ${lowMarginProduct.productName}; su margen promedio fue del ${lowMarginProduct.profitMargin.toFixed(1)}%.`
      )
    }

    const scenarios = [
      {
        title: "Aumentar precios un 5%",
        description: "Simula un incremento moderado en los productos con mayor demanda para mejorar el margen bruto.",
        impact: "Posible +3% en ingresos y +4% en margen si se mantiene el volumen de ventas.",
      },
      {
        title: "Campaña de clientes dormidos",
        description: "Contactar a los clientes inactivos con promociones personalizadas para recuperar su actividad.",
        impact: "Podría reactivar hasta un 15% de clientes dormidos y sumar tickets promedio adicionales.",
      },
    ]

    return {
      summary: fallbackSummary,
      highlights: sortedHighlights,
      anomalies,
      recommendations,
      scenarios,
    }
  }

  static async generateInsights(organizationId: string, dateRange?: DateRangeInput) {
    const context = await this.buildContext(organizationId, dateRange)
    const prompt = [
      {
        role: "system" as const,
        content:
          "Eres un analista financiero senior. Debes entregar insights concretos y accionables basados en los datos proporcionados. Responde únicamente en JSON válido.",
      },
      {
        role: "user" as const,
        content: `Genera un resumen ejecutivo y hallazgos para el siguiente contexto de negocio:\n${JSON.stringify(
          context
        )}\nEl JSON de respuesta debe tener la forma:\n{\n  "summary": string,\n  "highlights": string[],\n  "anomalies": string[],\n  "recommendations": string[],\n  "scenarios": [{ "title": string, "description": string, "impact": string }]\n}`,
      },
    ]

    try {
      const response = await chatCompleteWithOptions(prompt, { temperature: 0.2 })
      const parsed = this.safeJsonParse<InsightsResponse>(response, DEFAULT_INSIGHTS)

      if (!parsed.summary) {
        return this.buildFallbackInsights(context.kpis, context.trends, context.profitability)
      }

      return parsed
    } catch {
      return this.buildFallbackInsights(context.kpis, context.trends, context.profitability)
    }
  }

  static async answerQuestion(
    organizationId: string,
    question: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
    dateRange?: DateRangeInput
  ) {
    const context = await this.buildContext(organizationId, dateRange)
    const messages = [
      {
        role: "system" as const,
        content:
          "Actúa como un analista de inteligencia de negocios. Responde en español con máximo 3 párrafos y resalta cifras clave. Si la pregunta no puede responderse con los datos, sé honesto.",
      },
      {
        role: "user" as const,
        content: `Contexto estructurado (JSON): ${JSON.stringify(context)}`,
      },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      {
        role: "user" as const,
        content: question,
      },
    ]

    const answer = await chatCompleteWithOptions(messages, { temperature: 0.3 })
    return answer.trim()
  }

  static async generateReport(organizationId: string, dateRange?: DateRangeInput) {
    const context = await this.buildContext(organizationId, dateRange)
    const prompt = [
      {
        role: "system" as const,
        content:
          "Eres un asistente que genera reportes ejecutivos en formato Markdown. Incluye resumen, KPIs, insights clave, recomendaciones y próximos pasos.",
      },
      {
        role: "user" as const,
        content: `Genera un reporte ejecutivo en Markdown (máximo 600 palabras) usando este contexto:\n${JSON.stringify(
          context
        )}\nIncluye secciones: Resumen, KPIs destacados, Hallazgos, Recomendaciones, Próximos pasos.`,
      },
    ]

    try {
      const markdown = await chatCompleteWithOptions(prompt, { temperature: 0.25 })
      return {
        markdown: markdown.trim(),
        generatedAt: new Date().toISOString(),
      }
    } catch {
      const fallback = [
        "# Reporte Ejecutivo",
        "",
        "## Resumen",
        "No se pudo generar un reporte con IA. Revisa los datos de KPIs y tendencias para obtener mayor detalle.",
        "",
        "## Próximos pasos",
        "- Reintentar la generación cuando la IA esté disponible.",
      ].join("\n")

      return {
        markdown: fallback,
        generatedAt: new Date().toISOString(),
      }
    }
  }
}


