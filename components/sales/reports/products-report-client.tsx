"use client"

import { ArrowLeft, Download, Package, ShoppingCart, TrendingDown, AlertTriangle, DollarSign, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { InventoryStatusChart } from "./charts/inventory-status-chart"
import { ProductsByCategoryChart } from "./charts/products-by-category-chart"
import { TopProductsChart } from "./charts/top-products-chart"
import { ReportAiSummary } from "./report-ai-summary"
import { ReportDateQuickFilters } from "./report-date-quick-filters"

import type { ProductsReport } from "@/lib/services/sales/reports-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportProductsReportToPDF } from "@/lib/utils/pdf-reports-export"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"


interface ProductsReportClientProps {
  customerSlug: string
}

export function ProductsReportClient({ customerSlug }: ProductsReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<ProductsReport | null>(null)
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

      const response = await fetch(`/api/${customerSlug}/reportes/products?${params.toString()}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error fetching products report:", error)
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
      await exportProductsReportToPDF(report, customerSlug, startDate, endDate)
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
              Reporte de Productos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis de inventario y productos
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
            Reporte de Productos
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Análisis de inventario y productos
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

      <ReportAiSummary
        customerSlug={customerSlug}
        type="products"
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Productos
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {report?.totalProducts || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Activos
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 break-words">
                  {report?.activeProducts || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-950/20 dark:to-gray-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Inactivos
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 break-words">
                  {report?.inactiveProducts || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Tag className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stock Bajo
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 sm:mt-2 break-words">
                  {report?.lowStockProducts || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sin Stock
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2 break-words">
                  {report?.outOfStockProducts || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Inventario
                </p>
                <p className="text-sm sm:text-base md:text-lg xl:text-xl font-bold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.totalStockValue || 0), customerSlug)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {report && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <InventoryStatusChart
            activeProducts={report.activeProducts}
            inactiveProducts={report.inactiveProducts}
            lowStockProducts={report.lowStockProducts}
            outOfStockProducts={report.outOfStockProducts}
          />
          {report.byCategory && report.byCategory.length > 0 && (
            <ProductsByCategoryChart data={report.byCategory} />
          )}
        </div>
      )}

      {/* Top Selling */}
      {report && report.topSelling.length > 0 && (
        <>
          <TopProductsChart data={report.topSelling} customerSlug={customerSlug} />
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Productos Más Vendidos
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad Vendida</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.topSelling.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell>{product.quantitySold}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyWithPreferences(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* By Category */}
      {report && report.byCategory.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Productos por Categoría
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad de Productos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byCategory.map((category) => (
                  <TableRow key={category.categoryId}>
                    <TableCell className="font-medium">{category.categoryName}</TableCell>
                    <TableCell>{category.productCount}</TableCell>
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

