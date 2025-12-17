"use client"

import { Sparkles, Lightbulb, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { BasicReportType, ReportAISummary } from "@/lib/services/sales/report-ai-service"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface ReportAiSummaryProps {
  customerSlug: string
  type: BasicReportType
  startDate?: string
  endDate?: string
}

export function ReportAiSummary({ customerSlug, type, startDate, endDate }: ReportAiSummaryProps) {
  const [summary, setSummary] = useState<ReportAISummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchSummary = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ type })
        if (startDate) params.append("startDate", startDate)
        if (endDate) params.append("endDate", endDate)

        const response = await fetch(`/api/${customerSlug}/reportes/ai-summary?${params.toString()}`, {
          credentials: "include",
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || "AI summary error")
        }
        if (isMounted) {
          setSummary(data.data)
        }
      } catch {
        if (isMounted) {
          setSummary(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSummary()
    return () => {
      isMounted = false
    }
  }, [customerSlug, type, startDate, endDate])

  return (
    <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 text-white rounded-full p-2">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Resumen con IA
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Análisis inteligente de tus datos
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1 border-purple-200 dark:border-purple-800">
            {loading ? "Generando..." : "Powered by AI"}
          </Badge>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando resumen inteligente...
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary.summary}</p>
            {summary.highlights?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Puntos destacados</p>
                <ul className="space-y-1.5">
                  {summary.highlights.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.actions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Recomendaciones
                </p>
                <ul className="space-y-1.5">
                  {summary.actions.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !summary && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se pudo generar el resumen en este momento.
          </p>
        )}
      </CardContent>
    </Card>
  )
}


