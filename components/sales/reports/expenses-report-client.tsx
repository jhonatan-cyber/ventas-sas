"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, TrendingDown, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ExpensesReport } from "@/lib/services/sales/reports-service"

interface ExpensesReportClientProps {
  customerSlug: string
}

export function ExpensesReportClient({ customerSlug }: ExpensesReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<ExpensesReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/${customerSlug}/reportes/expenses?${params.toString()}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error fetching expenses report:", error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = () => {
    console.log("Exporting expenses report...")
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Reporte de Gastos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis detallado de gastos
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Reporte de Gastos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis detallado de gastos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/${customerSlug}/reportes`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
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
                onClick={fetchReport}
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Gastos
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {report?.totalExpenses || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monto Total
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  BOB {Number(report?.totalAmount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      {report && report.byCategory.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gastos por Categoría
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byCategory.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell>{category.count}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                      BOB {category.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
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

