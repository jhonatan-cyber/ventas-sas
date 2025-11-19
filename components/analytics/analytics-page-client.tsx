"use client"

import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Target,
  Brain,
  PieChart,
  LineChart,
  Activity,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  FileText,
  Download,
  Loader2
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { CustomerSegmentationChart } from "./customer-segmentation-chart"
import { DateRangePicker } from "./date-range-picker"
import { KPICard } from "./kpi-card"
import { KPICustomizer } from "./kpi-customizer"
import { ProductProfitabilityTable } from "./product-profitability-table"
import { SalesPredictionsChart } from "./sales-predictions-chart"
import { TrendsChart } from "./trends-chart"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"


interface AnalyticsPageClientProps {
  organizationId: string
  customerSlug: string
}

export function AnalyticsPageClient({ organizationId: _organizationId, customerSlug }: AnalyticsPageClientProps) {
  const t = useTranslations()
  const [kpis, setKpis] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [profitability, setProfitability] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([])
  const [aiInsights, setAiInsights] = useState<{
    summary: string
    highlights: string[]
    anomalies: string[]
    recommendations: string[]
    scenarios: Array<{ title: string; description: string; impact: string }>
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        t("analytics.ai.chatIntro") ||
        "Hola, soy tu asistente inteligente. Pregúntame sobre ventas, clientes o cualquier indicador del período.",
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [reportGenerating, setReportGenerating] = useState(false)

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append("start", dateRange.start.toISOString())
      params.append("end", dateRange.end.toISOString())
    }
    return params.toString()
  }, [dateRange])

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const query = buildQuery()
      const [kpisRes, trendsRes, profitabilityRes, segmentsRes, predictionsRes] = await Promise.all([
        fetch(`/api/${customerSlug}/analytics/kpis${query ? `?${query}` : ""}`, { credentials: "include" }),
        fetch(`/api/${customerSlug}/analytics/trends${query ? `?${query}` : ""}`, { credentials: "include" }),
        fetch(`/api/${customerSlug}/analytics/profitability${query ? `?${query}` : ""}`, { credentials: "include" }),
        fetch(`/api/${customerSlug}/analytics/segmentation`, { credentials: "include" }),
        fetch(`/api/${customerSlug}/analytics/predictions`, { credentials: "include" }),
      ])

      const [kpisData, trendsData, profitabilityData, segmentsData, predictionsData] = await Promise.all([
        kpisRes.json(),
        trendsRes.json(),
        profitabilityRes.json(),
        segmentsRes.json(),
        predictionsRes.json(),
      ])

      if (kpisData.success) setKpis(kpisData.data || [])
      if (trendsData.success) setTrends(trendsData.data || [])
      if (profitabilityData.success) setProfitability(profitabilityData.data || [])
      if (segmentsData.success) setSegments(segmentsData.data || [])
      if (predictionsData.success) setPredictions(predictionsData.data || [])

      // Inicializar KPIs seleccionados con todos los disponibles
      if (kpisData.success && kpisData.data) {
        setSelectedKPIs((prev) => (prev.length === 0 ? kpisData.data.map((k: any) => k.id) : prev))
      }
    } catch (error) {
      console.error("Error cargando analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [buildQuery, customerSlug])

  const loadAIInsights = useCallback(async () => {
    setAiLoading(true)
    try {
      const query = buildQuery()
      const response = await fetch(`/api/${customerSlug}/analytics/insights${query ? `?${query}` : ""}`, {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudieron cargar los insights")
      }
      setAiInsights(data.data)
    } catch (error) {
      console.error("Error cargando insights IA:", error)
      toast.error("No se pudieron cargar los insights inteligentes.")
      setAiInsights(null)
    } finally {
      setAiLoading(false)
    }
  }, [buildQuery, customerSlug])

  useEffect(() => {
    loadAnalytics()
    loadAIInsights()
  }, [loadAnalytics, loadAIInsights])

  const handleAskQuestion = async () => {
    if (!chatInput.trim()) return
    const newMessages = [...chatMessages, { role: "user" as const, content: chatInput.trim() }]
    setChatMessages(newMessages)
    setChatInput("")
    setChatLoading(true)

    try {
      const history = newMessages.slice(-6)
      const payload: any = {
        question: newMessages[newMessages.length - 1].content,
        history: history,
      }
      if (dateRange) {
        payload.dateRange = {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        }
      }
      const response = await fetch(`/api/${customerSlug}/analytics/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo obtener la respuesta")
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.data.answer }])
    } catch (error: any) {
      console.error("Error consultando IA:", error)
      toast.error(error?.message || "No se pudo responder la pregunta.")
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No pude obtener la respuesta en este momento. Intenta de nuevo más tarde." },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setReportGenerating(true)
    try {
      const payload: any = {}
      if (dateRange) {
        payload.dateRange = {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        }
      }
      const response = await fetch(`/api/${customerSlug}/analytics/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo generar el reporte")
      }

      const markdown = data.data?.markdown || ""
      const blob = new Blob([markdown], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const filename = `reporte-analytics-${new Date().toISOString().slice(0, 10)}.md`
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t("analytics.ai.reportSuccess") || "Reporte generado correctamente.")
    } catch (error: any) {
      console.error("Error generando reporte:", error)
      toast.error(error?.message || t("analytics.ai.reportError") || "No se pudo generar el reporte.")
    } finally {
      setReportGenerating(false)
    }
  }

  const displayedKPIs = kpis.filter(kpi => selectedKPIs.includes(kpi.id))

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title') || 'Analytics y Business Intelligence'}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.description') || 'Análisis avanzado de datos y métricas de tu negocio'}
          </p>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* KPIs Personalizables */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('analytics.kpis.title') || 'KPIs Principales'}
          </h2>
          <KPICustomizer
            kpis={kpis}
            selectedKPIs={selectedKPIs}
            onKPIsChange={setSelectedKPIs}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            displayedKPIs.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} customerSlug={customerSlug} />
            ))
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-dashed border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t("analytics.ai.summaryTitle") || "Resumen inteligente"}
            </CardTitle>
            <CardDescription>
              {t("analytics.ai.summaryDescription") || "Narrativa automática generada con IA."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ) : aiInsights ? (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiInsights.summary}
                </p>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {t("analytics.ai.highlights") || "Puntos destacados"}
                  </p>
                  <ul className="space-y-2">
                    {aiInsights.highlights.length > 0 ? (
                      aiInsights.highlights.map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          • {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">
                        {t("analytics.ai.insightsEmpty") || "Sin novedades para este período."}
                      </li>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">{t("analytics.ai.summaryFallback") || "Sin datos disponibles."}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {t("analytics.ai.recommendationsTitle") || "Recomendaciones e insights"}
            </CardTitle>
            <CardDescription>
              {t("analytics.ai.recommendationsDescription") || "Acciones sugeridas y alertas detectadas automáticamente."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400 mb-2">
                <AlertTriangle className="h-4 w-4" />
                {t("analytics.ai.anomaliesTitle") || "Anomalías"}
              </div>
              <ul className="space-y-2">
                {aiLoading ? (
                  <li className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ) : aiInsights && aiInsights.anomalies.length > 0 ? (
                  aiInsights.anomalies.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">
                    {t("analytics.ai.noAnomalies") || "Sin anomalías relevantes detectadas."}
                  </li>
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <Lightbulb className="h-4 w-4" />
                {t("analytics.ai.recommendations") || "Recomendaciones"}
              </div>
              <ul className="space-y-2">
                {aiLoading ? (
                  <li className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ) : aiInsights && aiInsights.recommendations.length > 0 ? (
                  aiInsights.recommendations.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">
                    {t("analytics.ai.noRecommendations") || "Sin acciones específicas por ahora."}
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-dashed border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {t("analytics.ai.scenariosTitle") || "Escenarios simulados"}
            </CardTitle>
            <CardDescription>
              {t("analytics.ai.scenariosDescription") || "Explora impactos potenciales con IA."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiLoading ? (
              <>
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </>
            ) : aiInsights && aiInsights.scenarios.length > 0 ? (
              aiInsights.scenarios.map((scenario, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{scenario.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{scenario.description}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">{scenario.impact}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">{t("analytics.ai.noScenarios") || "Sin escenarios disponibles."}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-500" />
              {t("analytics.ai.chatTitle") || "Asistente conversacional"}
            </CardTitle>
            <CardDescription>
              {t("analytics.ai.chatDescription") || "Haz preguntas directas sobre tus métricas."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 overflow-y-auto space-y-3 pr-2 mb-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      : "bg-blue-600 text-white ml-auto"
                  } max-w-full`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder={t("analytics.ai.chatPlaceholder") || "Ej. ¿Cuál fue el margen promedio esta semana?"}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="min-h-[90px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleAskQuestion} disabled={chatLoading || !chatInput.trim()}>
                  {chatLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("analytics.ai.chatButton") || "Preguntar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {t("analytics.ai.reportTitle") || "Reporte ejecutivo con IA"}
            </CardTitle>
            <CardDescription>
              {t("analytics.ai.reportDescription") || "Genera un documento listo para compartir con tu equipo."}
            </CardDescription>
          </div>
          <Button onClick={handleGenerateReport} disabled={reportGenerating}>
            {reportGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("analytics.ai.reportGenerating") || "Generando..."}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t("analytics.ai.reportButton") || "Descargar reporte"}
              </>
            )}
          </Button>
        </CardHeader>
      </Card>

      {/* Tabs con diferentes análisis */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.tabs.trends') || 'Tendencias'}</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.tabs.profitability') || 'Rentabilidad'}</span>
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.tabs.segmentation') || 'Segmentación'}</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.tabs.predictions') || 'Predicciones'}</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.tabs.overview') || 'Resumen'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                {t('analytics.trends.title') || 'Análisis de Tendencias'}
              </CardTitle>
              <CardDescription>
                {t('analytics.trends.description') || 'Evolución de ventas e ingresos en el tiempo'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendsChart data={trends} loading={loading} customerSlug={customerSlug} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('analytics.profitability.title') || 'Rentabilidad por Producto'}
              </CardTitle>
              <CardDescription>
                {t('analytics.profitability.description') || 'Análisis de ingresos, costos y márgenes de ganancia por producto'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductProfitabilityTable data={profitability} loading={loading} customerSlug={customerSlug} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {t('analytics.segmentation.title') || 'Segmentación de Clientes'}
              </CardTitle>
              <CardDescription>
                {t('analytics.segmentation.description') || 'Análisis RFM: Recency, Frequency, Monetary'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerSegmentationChart data={segments} loading={loading} customerSlug={customerSlug} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t('analytics.predictions.title') || 'Predicciones con Machine Learning'}
              </CardTitle>
              <CardDescription>
                {t('analytics.predictions.description') || 'Pronósticos de ventas futuras basados en datos históricos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesPredictionsChart data={predictions} loading={loading} customerSlug={customerSlug} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('analytics.overview.trends') || 'Tendencias Rápidas'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendsChart data={trends.slice(-30)} loading={loading} customerSlug={customerSlug} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('analytics.overview.topProducts') || 'Top Productos Rentables'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductProfitabilityTable data={profitability.slice(0, 5)} loading={loading} customerSlug={customerSlug} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

