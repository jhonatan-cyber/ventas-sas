"use client"

import { ArrowLeft, Download, DollarSign, TrendingUp, ShoppingCart, TrendingDown, Receipt, Package, Users, Percent, TrendingUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { ReportAiSummary } from "./report-ai-summary"
import { ReportDateQuickFilters } from "./report-date-quick-filters"

import type { GeneralReport, SalesReport, BranchPerformanceReport } from "@/lib/services/sales/reports-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { exportGeneralReportToPDF } from "@/lib/utils/pdf-reports-export"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"


interface GeneralReportClientProps {
  customerSlug: string
}

export function GeneralReportClient({ customerSlug }: GeneralReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<GeneralReport | null>(null)
  const [previousReport, setPreviousReport] = useState<GeneralReport | null>(null)
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [branchesReport, setBranchesReport] = useState<BranchPerformanceReport[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComparing, setIsComparing] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [comparePrevious, setComparePrevious] = useState(false)

  const calculatePreviousRange = (start: string, end: string) => {
    const startD = new Date(start + "T00:00:00")
    const endD = new Date(end + "T00:00:00")
    const diffMs = endD.getTime() - startD.getTime()
    const prevEnd = new Date(startD.getTime() - 24 * 60 * 60 * 1000)
    const prevStart = new Date(prevEnd.getTime() - diffMs)

    const format = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    }

    return { start: format(prevStart), end: format(prevEnd) }
  }

  const fetchPreviousReport = useCallback(
    async (currentStart: string, currentEnd: string) => {
      try {
        setIsComparing(true)
        const prevRange = calculatePreviousRange(currentStart, currentEnd)
        const params = new URLSearchParams()
        params.append("startDate", prevRange.start)
        params.append("endDate", prevRange.end)

        const response = await fetch(`/api/${customerSlug}/reportes/general?${params.toString()}`)
        const data = await response.json()
        setPreviousReport(data)
      } catch (error) {
        console.error("Error fetching previous general report:", error)
        setPreviousReport(null)
      } finally {
        setIsComparing(false)
      }
    },
    [customerSlug]
  )

  const fetchReport = useCallback(
    async (range?: { startDate?: string; endDate?: string }) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        const finalStart = range?.startDate ?? startDate
        const finalEnd = range?.endDate ?? endDate
        if (finalStart) params.append("startDate", finalStart)
        if (finalEnd) params.append("endDate", finalEnd)

        const query = params.toString()

        const [generalRes, salesRes, branchesRes] = await Promise.all([
          fetch(`/api/${customerSlug}/reportes/general?${query}`),
          fetch(`/api/${customerSlug}/reportes/sales?${query}`),
          fetch(`/api/${customerSlug}/reportes/branches?${query}`),
        ])

        const [generalData, salesData, branchesData] = await Promise.all([
          generalRes.json(),
          salesRes.json().catch(() => null),
          branchesRes.json().catch(() => null),
        ])

        setReport(generalData)
        setSalesReport(salesData)
        setBranchesReport(Array.isArray(branchesData) ? branchesData : null)

        if (comparePrevious && finalStart && finalEnd) {
          fetchPreviousReport(finalStart, finalEnd)
        } else {
          setPreviousReport(null)
        }
      } catch (error) {
        console.error("Error fetching general report:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [customerSlug, startDate, endDate, comparePrevious, fetchPreviousReport]
  )

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = useCallback(async () => {
    if (!report) {
      toast.error("No hay datos para exportar")
      return
    }

    const toastId = toast.loading("Generando reporte...")
    try {
      await exportGeneralReportToPDF(report, customerSlug, startDate, endDate)
      toast.success("Reporte exportado exitosamente", { id: toastId })
    } catch (error) {
      console.error("Error al exportar PDF:", error)
      toast.error("Error al exportar reporte", { id: toastId })
    } finally {
      toast.dismiss(toastId)
    }
  }, [report, customerSlug, startDate, endDate])

  const isInitialLoading = isLoading && !report

  if (isInitialLoading) {
    return (
      <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Reporte General
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Vista general de operaciones
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Cargando reporte...
        </div>
      </div>
    )
  }

  // KPIs derivados
  const totalSales = salesReport?.totalSales ?? report?.salesCount ?? 0
  const totalRevenue = Number(salesReport?.totalRevenue ?? report?.totalRevenue ?? 0)
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const topProduct = salesReport?.topProducts?.[0] ?? null
  const topCustomer = salesReport?.topCustomers?.[0] ?? null
  const topBranch = branchesReport && branchesReport.length > 0 ? branchesReport[0] : null

  const marginValue = Number(report?.profitMargin || 0)
  const marginStatus =
    marginValue >= 30 ? "good" : marginValue >= 15 ? "warning" : "bad"

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Reporte General
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Vista general de operaciones comerciales
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto"
            onClick={() => router.push(`/${customerSlug}/reportes`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <ReportDateQuickFilters
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start)
                setEndDate(end)
              }}
              onApply={(start, end) => {
                fetchReport({ startDate: start, endDate: end })
              }}
            />
            <div className="flex items-center gap-2">
              <input
                id="compare-previous-period"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={comparePrevious}
                onChange={(e) => {
                  const enabled = e.target.checked
                  setComparePrevious(enabled)
                  if (enabled && startDate && endDate) {
                    fetchPreviousReport(startDate, endDate)
                  } else {
                    setPreviousReport(null)
                  }
                }}
              />
              <label
                htmlFor="compare-previous-period"
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
              >
                Comparar con período anterior
              </label>
              {comparePrevious && (!startDate || !endDate) && (
                <span className="text-[11px] text-amber-500">
                  Selecciona fecha inicio y fin
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Fecha inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Fecha fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="rounded-full w-full"
                onClick={() => fetchReport()}
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReportAiSummary
        customerSlug={customerSlug}
        type="general"
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />

      {/* KPIs ejecutivos */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Ingresos
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {formatCurrencyWithPreferences(totalRevenue)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Ventas:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{totalSales}</span>
              {averageTicket > 0 && (
                <>
                  {" · "}
                  Ticket:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {formatCurrencyWithPreferences(averageTicket)}
                  </span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/60 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Utilidad neta
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                  {formatCurrencyWithPreferences(Number(report?.netProfit || 0))}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Gastos:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {formatCurrencyWithPreferences(Number(report?.totalExpenses || 0))}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-purple-50/60 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Margen
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate flex items-baseline gap-1">
                  {marginValue.toFixed(1)}%
                  <span
                    className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold
                      ${
                        marginStatus === "good"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : marginStatus === "warning"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                  >
                    {marginStatus === "good"
                      ? "Saludable"
                      : marginStatus === "warning"
                      ? "Atención"
                      : "Crítico"}
                  </span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUpDown className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Meta sugerida: <span className="font-semibold">30%+</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-slate-50/60 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Top desempeño
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
                  {topBranch ? (
                    <>
                      Sucursal:{" "}
                      <span className="font-semibold">{topBranch.branchName}</span>
                    </>
                  ) : (
                    "Sin datos de sucursales"
                  )}
                </p>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {topProduct ? (
                <>
                  Producto:{" "}
                  <span className="font-semibold">{topProduct.productName}</span>
                </>
              ) : (
                "Sin top producto"
              )}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {topCustomer ? (
                <>
                  Cliente:{" "}
                  <span className="font-semibold">{topCustomer.customerName}</span>
                </>
              ) : (
                "Sin top cliente"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      {comparePrevious && isComparing && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Calculando comparación con el período anterior...
        </p>
      )}

      {(() => {
        const currentRevenue = Number(report?.totalRevenue || 0)
        const prevRevenue = Number(previousReport?.totalRevenue || 0)
        const currentExpenses = Number(report?.totalExpenses || 0)
        const prevExpenses = Number(previousReport?.totalExpenses || 0)
        const currentNet = Number(report?.netProfit || 0)
        const prevNet = Number(previousReport?.netProfit || 0)
        const currentMargin = Number(report?.profitMargin || 0)
        const prevMargin = Number(previousReport?.profitMargin || 0)

        const calcDelta = (current: number, prev: number) => {
          if (!previousReport || prev === 0) return null
          return ((current - prev) / Math.abs(prev)) * 100
        }

        const revenueDelta = calcDelta(currentRevenue, prevRevenue)
        const expensesDelta = calcDelta(currentExpenses, prevExpenses)
        const netDelta = calcDelta(currentNet, prevNet)
        const marginDelta = calcDelta(currentMargin, prevMargin)

        const renderDelta = (delta: number | null) => {
          if (delta === null) return null
          const isPositive = delta >= 0
          return (
            <span className={`ml-1 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
              ({isPositive ? "+" : ""}{delta.toFixed(1)}%)
            </span>
          )
        }

        return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingresos Totales
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.totalRevenue || 0))}
                </p>
                {comparePrevious && previousReport && (
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Anterior: {formatCurrencyWithPreferences(prevRevenue)}
                    {renderDelta(revenueDelta)}
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Gastos Totales
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.totalExpenses || 0))}
                </p>
                {comparePrevious && previousReport && (
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Anterior: {formatCurrencyWithPreferences(prevExpenses)}
                    {renderDelta(expensesDelta)}
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Utilidad Neta
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.netProfit || 0))}
                </p>
                {comparePrevious && previousReport && (
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Anterior: {formatCurrencyWithPreferences(prevNet)}
                    {renderDelta(netDelta)}
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Margen de Utilidad
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 break-words">
                  {Number(report?.profitMargin || 0).toFixed(1)}%
                </p>
                {comparePrevious && previousReport && (
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Anterior: {prevMargin.toFixed(1)}%
                    {renderDelta(marginDelta)}
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        )
      })()}

      {/* Operations Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2">
                  {report?.salesCount || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Gastos
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2">
                  {report?.expensesCount || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2">
                  {report?.quotationsCount || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productos
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2">
                  {report?.productsCount || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clientes
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1 sm:mt-2">
                  {report?.customersCount || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

