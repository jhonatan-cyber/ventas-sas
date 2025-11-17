"use client"

import { FileText, CheckCircle2, XCircle, DollarSign } from "lucide-react"

import { SalesSaleWithRelations } from "./types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface SalesStatsProps {
  sales: SalesSaleWithRelations[]
  isLoading?: boolean
}

const computeStats = (sales: SalesSaleWithRelations[]) => {
  const total = sales.length
  const completed = sales.filter((s) => s.status === "completed").length
  const cancelled = sales.filter((s) => s.status === "cancelled").length
  const totalValue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0)
  const completedValue = sales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + Number(s.total || 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSales = sales.filter((sale) => (sale.createdAt ? new Date(sale.createdAt) >= startOfMonth : false))
  const monthValue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0)

  return {
    total,
    completed,
    cancelled,
    totalValue,
    completedValue,
    monthValue,
    completedPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancelledPercentage: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    monthCount: monthSales.length,
  }
}

const formatCurrency = (value: number) => formatCurrencyWithPreferences(value)

export function SalesStats({ sales, isLoading = false }: SalesStatsProps) {
  const {
    total,
    completed,
    cancelled,
    totalValue,
    completedValue,
    monthValue,
    completedPercentage,
    cancelledPercentage,
    monthCount,
  } = computeStats(sales)

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
            Total
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
            {isLoading ? "--" : total.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2">
            {isLoading
              ? "Calculando ventas registradas"
              : `Completadas: ${completed} · Anuladas: ${cancelled} · Valor: ${formatCurrency(totalValue)}`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
            Completadas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
            {isLoading ? "--" : completed.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
            {isLoading ? "Calculando..." : `${completedPercentage}% del total • Valor: ${formatCurrency(completedValue)}`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-red-900 dark:text-red-100">
            Anuladas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">
            {isLoading ? "--" : cancelled.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 mt-1 line-clamp-2">
            {isLoading ? "Calculando..." : `${cancelledPercentage}% del total • Ventas canceladas`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">
            Monto Total
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-base sm:text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100 break-words">
            {isLoading ? "--" : formatCurrency(totalValue)}
          </div>
          <p className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300 mt-1 line-clamp-2">
            {isLoading
              ? "Calculando..."
              : `Este mes: ${monthCount} ventas • ${formatCurrency(monthValue)}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
