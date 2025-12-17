"use client"

import { ArrowLeft, Download, Receipt, Lock, Unlock, DollarSign, DoorOpen, DoorClosed, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { CashRegistersByBranchChart } from "./charts/cash-registers-by-branch-chart"
import { ReportDateQuickFilters } from "./report-date-quick-filters"

import type { CashRegisterReport } from "@/lib/services/sales/reports-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportCashRegistersReportToPDF } from "@/lib/utils/pdf-reports-export"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"


interface CashRegistersReportClientProps {
  customerSlug: string
}

export function CashRegistersReportClient({ customerSlug }: CashRegistersReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<CashRegisterReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = useCallback(async (range?: { startDate?: string; endDate?: string }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      const finalStart = range?.startDate ?? startDate
      const finalEnd = range?.endDate ?? endDate
      if (finalStart) params.append("startDate", finalStart)
      if (finalEnd) params.append("endDate", finalEnd)

      const response = await fetch(`/api/${customerSlug}/reportes/cash-registers?${params.toString()}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error fetching cash registers report:", error)
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

    const toastId = toast.loading("Generando reporte...")
    try {
      await exportCashRegistersReportToPDF(report, customerSlug, startDate, endDate)
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
              Reporte de Cajas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis de cajas registradoras
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Cargando reporte...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Reporte de Cajas
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Análisis de cajas registradoras
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
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cajas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {report?.totalCashRegisters || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Abiertas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 break-words">
                  {report?.openCashRegisters || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Unlock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-950/20 dark:to-gray-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cerradas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 break-words">
                  {report?.closedCashRegisters || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Balance Total
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-violet-600 dark:text-violet-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.totalBalance || 0))}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Aperturas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1 sm:mt-2 break-words">
                  {report?.totalOpenings || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cierres
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2 break-words">
                  {report?.totalClosings || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DoorClosed className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Branch */}
      {report && report.byBranch.length > 0 && (
        <>
          <CashRegistersByBranchChart data={report.byBranch} />
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cajas por Sucursal
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Cantidad de Cajas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byBranch.map((branch) => (
                    <TableRow key={branch.branchId}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        {branch.branchName}
                      </TableCell>
                      <TableCell>{branch.cashRegisterCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

