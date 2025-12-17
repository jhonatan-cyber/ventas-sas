"use client"

import { ArrowLeft, Download, Building2, TrendingUp, DollarSign, Percent } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { BranchesPerformanceChart } from "./charts/branches-performance-chart"

import type { BranchPerformanceReport } from "@/lib/services/sales/reports-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportBranchesReportToPDF } from "@/lib/utils/pdf-reports-export"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface BranchesReportClientProps {
  customerSlug: string
}

export function BranchesReportClient({ customerSlug }: BranchesReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<BranchPerformanceReport[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/${customerSlug}/reportes/branches?${params.toString()}`)
      const data = await response.json()
      setReport(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching branches report:", error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = useCallback(async () => {
    if (!report) {
      toast.error("No hay datos para exportar")
      return
    }

    try {
      toast.loading("Generando reporte...")
      await exportBranchesReportToPDF(report, customerSlug, startDate, endDate)
      toast.dismiss()
      toast.success("Reporte exportado exitosamente")
    } catch (error) {
      toast.dismiss()
      console.error("Error al exportar PDF:", error)
      toast.error("Error al exportar reporte")
    }
  }, [report, customerSlug, startDate, endDate])

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Desempeño por Sucursal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis de ventas e ingresos por sucursal
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Cargando reporte...
        </div>
      </div>
    )
  }

  const totalBranches = report?.length || 0
  const totalSales = report?.reduce((sum, b) => sum + b.salesCount, 0) || 0
  const totalRevenue = report?.reduce((sum, b) => sum + b.revenue, 0) || 0
  const avgTicket =
    totalSales > 0 ? totalRevenue / totalSales : 0

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Desempeño por Sucursal
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Análisis de ventas e ingresos por cada sucursal
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => router.push(`/${customerSlug}/reportes`)}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto text-xs sm:text-sm"
            onClick={handleExport}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
        <CardContent className="p-4 sm:p-6">
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

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-sky-50/50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Sucursales
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 sm:mt-2 break-words">
                  {totalBranches}
                </p>
              </div>
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas Totales
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 break-words">
                  {totalSales}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingresos Totales
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(totalRevenue)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
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
                  Ticket Promedio Global
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(avgTicket)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {report && report.length > 0 && (
        <BranchesPerformanceChart
          data={report}
        />
      )}

      {/* Table */}
      {report && report.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalle por Sucursal
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                  <TableHead className="text-right">% Contribución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((branch) => (
                  <TableRow key={branch.branchId}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      {branch.branchName}
                    </TableCell>
                    <TableCell>{branch.salesCount}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyWithPreferences(branch.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyWithPreferences(branch.averageTicket)}
                    </TableCell>
                    <TableCell className="text-right">
                      {branch.contribution.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


