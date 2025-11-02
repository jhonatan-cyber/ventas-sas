"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { SalesReport } from "@/lib/services/sales/reports-service"

interface SalesReportClientProps {
  customerSlug: string
}

export function SalesReportClient({ customerSlug }: SalesReportClientProps) {
  const router = useRouter()
  const [report, setReport] = useState<SalesReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/${customerSlug}/reportes/sales?${params.toString()}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error fetching sales report:", error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log("Exporting sales report...")
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Reporte de Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis detallado de ventas
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Ventas
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {report?.totalSales || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingresos Totales
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  BOB {Number(report?.totalRevenue || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Anuladas
                </p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                  {report?.byStatus.cancelled.count || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10 backdrop-blur-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingreso Neto
                </p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-2">
                  BOB {Number(report?.netRevenue || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {report && report.topProducts.length > 0 && (
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
                      BOB {product.revenue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
                      BOB {customer.totalSpent.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Payment Method */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ventas por Método de Pago
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(report?.byPaymentMethod || {}).map(([method, data]) => {
              const labels: Record<string, string> = {
                cash: "Efectivo",
                card: "Tarjeta",
                transfer: "Transferencia",
                qr: "QR / Billetera"
              }
              return (
                <div key={method} className="text-center p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {labels[method]}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {data.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    BOB {data.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

