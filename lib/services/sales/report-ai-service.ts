import { ReportsService, GeneralReport, SalesReport, ProductsReport, ExpensesReport, BranchPerformanceReport } from "./reports-service"

import { chatCompleteWithOptions } from "@/lib/services/ai/provider"

export type BasicReportType = "general" | "sales" | "products" | "expenses"

interface DateRangeInput {
  start?: Date
  end?: Date
}

export interface ReportAISummary {
  summary: string
  highlights: string[]
  actions: string[]
  confidence: number
  generatedAt: string
}

export interface AdvancedReportAIResult {
  summary: string
  opportunities: string[]
  risks: string[]
  nextActions: string[]
  confidence: number
}

export interface AdvancedReportResponse {
  generatedAt: string
  ai: AdvancedReportAIResult
  branchPerformance: BranchPerformanceReport[]
  productHighlights: SalesReport["topProducts"]
  customerHighlights: SalesReport["topCustomers"]
  kpis: {
    totalRevenue: number
    netProfit: number
    profitMargin: number
    totalExpenses: number
  }
}

const DEFAULT_SUMMARY: ReportAISummary = {
  summary: "No se detectaron variaciones significativas en este período.",
  highlights: [],
  actions: [],
  confidence: 0.4,
  generatedAt: new Date().toISOString(),
}

const DEFAULT_ADVANCED: AdvancedReportAIResult = {
  summary: "El desempeño general se mantiene estable, sin riesgos críticos detectados.",
  opportunities: [],
  risks: [],
  nextActions: [],
  confidence: 0.4,
}

export class ReportAIService {
  private static async buildBasicContext(
    organizationId: string,
    type: BasicReportType,
    dateRange?: DateRangeInput
  ) {
    switch (type) {
      case "general":
        return ReportsService.getGeneralReport(organizationId, dateRange?.start, dateRange?.end)
      case "sales":
        return ReportsService.getSalesReport(organizationId, dateRange?.start, dateRange?.end)
      case "products":
        return ReportsService.getProductsReport(organizationId, dateRange?.start, dateRange?.end)
      case "expenses":
        return ReportsService.getExpensesReport(organizationId, dateRange?.start, dateRange?.end)
      default:
        return null
    }
  }

  private static buildFallbackSummary(
    type: BasicReportType,
    context: GeneralReport | SalesReport | ProductsReport | ExpensesReport | null
  ): ReportAISummary {
    const generatedAt = new Date().toISOString()
    if (!context) {
      return { ...DEFAULT_SUMMARY, generatedAt }
    }

    const summary = (() => {
      switch (type) {
        case "general": {
          const general = context as GeneralReport
          return `Los ingresos netos fueron ${general.netProfit >= 0 ? "positivos" : "negativos"} y el margen se ubicó en ${general.profitMargin.toFixed(
            1
          )}%.`
        }
        case "sales": {
          const sales = context as SalesReport
          return `Se registraron ${sales.totalSales} ventas con ingresos netos de ${sales.netRevenue.toLocaleString()}.`
        }
        case "products": {
          const products = context as ProductsReport
          return `Hay ${products.activeProducts} productos activos y ${products.lowStockProducts} con bajo stock.`
        }
        case "expenses": {
          const expenses = context as ExpensesReport
          return `Los gastos sumaron ${expenses.totalAmount.toLocaleString()} distribuidos en ${expenses.byCategory.length} categorías.`
        }
      }
    })()

    const highlights: string[] = []
    const actions: string[] = []

    if (type === "sales") {
      const sales = context as SalesReport
      highlights.push(`Top producto: ${sales.topProducts[0]?.productName || "Sin datos"}.`)
      highlights.push(`Método de pago dominante: ${
        Object.entries(sales.byPaymentMethod || {})
          .sort((a, b) => b[1].amount - a[1].amount)[0]?.[0] || "Efectivo"
      }.`)
      if ((sales.totalRefunded || 0) > 0) {
        actions.push("Revisa las ventas canceladas para identificar causas.")
      }
    }

    if (type === "products") {
      const products = context as ProductsReport
      if (products.lowStockProducts > 0) {
        actions.push(`Abastece ${products.lowStockProducts} productos con stock crítico.`)
      }
      highlights.push(`Valor total inventario: ${products.totalStockValue.toLocaleString()}.`)
    }

    if (type === "expenses") {
      const expenses = context as ExpensesReport
      if (expenses.byCategory.length > 0) {
        highlights.push(
          `Categoría más costosa: ${expenses.byCategory[0].category} (${expenses.byCategory[0].amount.toLocaleString()}).`
        )
      }
    }

    return {
      summary: summary || DEFAULT_SUMMARY.summary,
      highlights,
      actions,
      confidence: 0.45,
      generatedAt,
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

  static async generateSummary(
    organizationId: string,
    type: BasicReportType,
    dateRange?: DateRangeInput
  ): Promise<ReportAISummary> {
    const context = await this.buildBasicContext(organizationId, type, dateRange)
    const fallback = this.buildFallbackSummary(type, context)

    if (!context) {
      return fallback
    }

    const prompt = [
      {
        role: "system" as const,
        content:
          "Eres un analista financiero. Resume los hallazgos en español y responde únicamente en JSON válido con las llaves: summary, highlights[], actions[], confidence (0-1).",
      },
      {
        role: "user" as const,
        content: `Genera insights para este reporte (${type}): ${JSON.stringify(context)}.`,
      },
    ]

    try {
      const response = await chatCompleteWithOptions(prompt, { temperature: 0.25 })
      const parsed = this.safeJsonParse<ReportAISummary>(response, fallback)

      const safeSummary =
        parsed && typeof parsed.summary === "string" && parsed.summary.trim().length > 0
          ? parsed.summary
          : fallback.summary

      const safeHighlights = Array.isArray(parsed?.highlights)
        ? parsed.highlights.filter((item) => typeof item === "string" && item.trim().length > 0)
        : fallback.highlights

      const safeActions = Array.isArray(parsed?.actions)
        ? parsed.actions.filter((item) => typeof item === "string" && item.trim().length > 0)
        : fallback.actions

      const safeConfidence =
        parsed && typeof parsed.confidence === "number" && !Number.isNaN(parsed.confidence)
          ? parsed.confidence
          : fallback.confidence

      return {
        summary: safeSummary,
        highlights: safeHighlights.length ? safeHighlights : fallback.highlights,
        actions: safeActions.length ? safeActions : fallback.actions,
        confidence: safeConfidence,
        generatedAt: new Date().toISOString(),
      }
    } catch {
      return fallback
    }
  }

  static async generateAdvancedReport(
    organizationId: string,
    dateRange?: DateRangeInput
  ): Promise<AdvancedReportResponse> {
    const [general, sales, expenses, branchPerformance] = await Promise.all([
      ReportsService.getGeneralReport(organizationId, dateRange?.start, dateRange?.end),
      ReportsService.getSalesReport(organizationId, dateRange?.start, dateRange?.end),
      ReportsService.getExpensesReport(organizationId, dateRange?.start, dateRange?.end),
      ReportsService.getBranchPerformanceReport(organizationId, dateRange?.start, dateRange?.end),
    ])

    const context = {
      general,
      sales,
      expenses,
      branchPerformance,
      topProducts: sales.topProducts.slice(0, 5),
      topCustomers: sales.topCustomers.slice(0, 5),
      period: {
        start: dateRange?.start?.toISOString() || null,
        end: dateRange?.end?.toISOString() || null,
      },
    }

    let aiResult = DEFAULT_ADVANCED

    const prompt = [
      {
        role: "system" as const,
        content:
          "Eres un director de BI. Analiza la información y responde en español con JSON { summary, opportunities[], risks[], nextActions[], confidence }.",
      },
      {
        role: "user" as const,
        content: `Contexto de reporte avanzado: ${JSON.stringify(context)}`,
      },
    ]

    try {
      const response = await chatCompleteWithOptions(prompt, { temperature: 0.2 })
      const parsed = this.safeJsonParse<AdvancedReportAIResult>(response, DEFAULT_ADVANCED)

      // Saneamos la respuesta de la IA para evitar objetos como hijos de React
      const rawSummary: unknown = (parsed as any)?.summary
      let safeSummary: string

      if (typeof rawSummary === "string") {
        safeSummary = rawSummary
      } else if (rawSummary && typeof rawSummary === "object") {
        // Si viene un objeto tipo { totalRevenue, totalExpenses, ... } lo convertimos a texto
        const s: any = rawSummary
        const parts: string[] = []
        if (typeof s.totalRevenue === "number") {
          parts.push(`Ingresos totales: ${s.totalRevenue.toLocaleString()}`)
        }
        if (typeof s.totalExpenses === "number") {
          parts.push(`Gastos totales: ${s.totalExpenses.toLocaleString()}`)
        }
        if (typeof s.netProfit === "number") {
          parts.push(`Utilidad neta: ${s.netProfit.toLocaleString()}`)
        }
        if (typeof s.profitMargin === "number") {
          parts.push(`Margen: ${s.profitMargin.toFixed(1)}%`)
        }
        if (typeof s.salesCount === "number") {
          parts.push(`Ventas: ${s.salesCount}`)
        }
        if (!parts.length) {
          safeSummary = DEFAULT_ADVANCED.summary
        } else {
          safeSummary = parts.join(" · ")
        }
      } else {
        safeSummary = DEFAULT_ADVANCED.summary
      }

      const normalizeStringArray = (value: unknown): string[] => {
        if (!Array.isArray(value)) return []
        return value
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object") {
              const anyItem: any = item
              if (typeof anyItem.description === "string") return anyItem.description
              // último recurso: JSON compacto
              try {
                return JSON.stringify(anyItem)
              } catch {
                return ""
              }
            }
            return ""
          })
          .filter((txt) => txt && txt.trim().length > 0)
      }

      const safeOpportunities = normalizeStringArray((parsed as any)?.opportunities)
      const safeRisks = normalizeStringArray((parsed as any)?.risks)
      const safeNextActions = normalizeStringArray((parsed as any)?.nextActions)

      aiResult = {
        summary: safeSummary,
        opportunities: safeOpportunities,
        risks: safeRisks,
        nextActions: safeNextActions,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : DEFAULT_ADVANCED.confidence,
      }
    } catch {
      aiResult = DEFAULT_ADVANCED
    }

    return {
      generatedAt: new Date().toISOString(),
      ai: aiResult,
      branchPerformance,
      productHighlights: sales.topProducts.slice(0, 5),
      customerHighlights: sales.topCustomers.slice(0, 5),
      kpis: {
        totalRevenue: general.totalRevenue,
        netProfit: general.netProfit,
        profitMargin: general.profitMargin,
        totalExpenses: general.totalExpenses,
      },
    }
  }
}


