"use client"

import { ArrowLeft, Download, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { PaymentMethodChart } from "./charts/payment-method-chart"
import { SalesByDateChart } from "./charts/sales-by-date-chart"
import { TopProductsChart } from "./charts/top-products-chart"
import { ReportAiSummary } from "./report-ai-summary"
import { ReportDateQuickFilters } from "./report-date-quick-filters"

import type { SalesReport } from "@/lib/services/sales/reports-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportSalesReportToPDF } from "@/lib/utils/pdf-reports-export"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"


interface SalesReportClientProps {
  customerSlug: string
}

export function SalesReportClient({ customerSlug }: SalesReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<SalesReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"all" | "cash" | "card" | "transfer" | "qr">("all")
  const [branchId, setBranchId] = useState<string>("all")
  const [onlyMySales, setOnlyMySales] = useState(false)
  const [branches, setBranches] = useState<Array<{ id: string; name: string | null }>>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchReport = useCallback(
    async (range?: { startDate?: string; endDate?: string }) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        const finalStart = range?.startDate ?? startDate
        const finalEnd = range?.endDate ?? endDate
        if (finalStart) params.append("startDate", finalStart)
        if (finalEnd) params.append("endDate", finalEnd)
        if (paymentMethod !== "all") params.append("paymentMethod", paymentMethod)
        if (branchId !== "all") params.append("branchId", branchId)
        if (onlyMySales && currentUserId) params.append("userId", currentUserId)

        const response = await fetch(`/api/${customerSlug}/reportes/sales?${params.toString()}`)
        const data = await response.json()
        setReport(data)
      } catch (error) {
        console.error("Error fetching sales report:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [customerSlug, startDate, endDate, paymentMethod, branchId, onlyMySales, currentUserId]
  )

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const t = useTranslations()

  // Cargar usuario actual y sucursales para filtros avanzados
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        // Usuario actual (para "Solo mis ventas")
        const meResponse = await fetch(`/api/${customerSlug}/auth/me`, { credentials: "include" })
        if (meResponse.ok) {
          const me = await meResponse.json()
          if (me?.id) {
            setCurrentUserId(me.id)
          }
        }

        // Sucursales activas
        const branchesResponse = await fetch(`/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`)
        if (branchesResponse.ok) {
          const data = await branchesResponse.json()
          const list =
            data?.branches?.map((b: any) => ({
              id: b.id as string,
              name: (b.name as string) || null,
            })) || []
          setBranches(list)
        }
      } catch (error) {
        console.error("Error cargando filtros de ventas:", error)
      }
    }

    loadFiltersData()
  }, [customerSlug])
  
  const handleExport = useCallback(async () => {
    if (!report) {
      toast.error(t('reports.export.noData'))
      return
    }

    const toastId = toast.loading(t('reports.export.generating'))
    try {
      await exportSalesReportToPDF(report, customerSlug, startDate, endDate)
      toast.success(t('reports.export.success'), { id: toastId })
    } catch (error) {
      console.error("Error al exportar PDF:", error)
      toast.error(t('reports.export.error'), { id: toastId })
    } finally {
      toast.dismiss(toastId)
    }
  }, [report, customerSlug, startDate, endDate, t])

  const isInitialLoading = isLoading && !report

  if (isInitialLoading) {
    return (
      <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Reporte de Ventas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis detallado de ventas
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
            Reporte de Ventas
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Análisis detallado de ventas
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
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full lg:w-auto">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Método de pago
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => {
                    setPaymentMethod(value as any)
                    // Reaplicar filtros al cambiar
                    fetchReport()
                  }}
                >
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Todos los métodos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todos los métodos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="qr">QR / Billetera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sucursal
                </Label>
                <Select
                  value={branchId}
                  onValueChange={(value) => {
                    setBranchId(value)
                    fetchReport()
                  }}
                >
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <input
                    id="only-my-sales"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={onlyMySales}
                    onChange={(e) => {
                      setOnlyMySales(e.target.checked)
                      fetchReport()
                    }}
                    disabled={!currentUserId}
                  />
                  <Label
                    htmlFor="only-my-sales"
                    className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                  >
                    Solo mis ventas
                  </Label>
                </div>
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
        type="sales"
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Ventas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {report?.totalSales || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

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
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Anuladas
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 sm:mt-2 break-words">
                  {report?.byStatus.cancelled.count || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingreso Neto
                </p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-violet-600 dark:text-violet-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferences(Number(report?.netRevenue || 0))}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {report && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {report.byDate && report.byDate.length > 0 && (
            <SalesByDateChart data={report.byDate} customerSlug={customerSlug} />
          )}
          <PaymentMethodChart data={report.byPaymentMethod} customerSlug={customerSlug} />
        </div>
      )}

      {/* Top Products */}
      {report && report.topProducts.length > 0 && (
        <>
          <TopProductsChart data={report.topProducts} customerSlug={customerSlug} />
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
                  {report.topProducts.map((product) => (
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

      {/* Top Customers */}
      {report && report.topCustomers.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clientes Principales
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topCustomers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-medium">{customer.customerName}</TableCell>
                    <TableCell>{customer.totalPurchases}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyWithPreferences(customer.totalSpent)}
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

