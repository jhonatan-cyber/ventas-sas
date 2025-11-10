"use client"

import { AlertCircle, Clock, FileText, TrendingUp } from "lucide-react"

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuotationsStatsProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
}

const computeStats = (quotations: SalesQuotationWithRelations[]) => {
  const total = quotations.length
  const active = quotations.filter((q) => q.status === "active").length
  const expired = quotations.filter((q) => q.status === "expired").length
  const converted = quotations.filter((q) => q.status === "converted").length
  const totalValue = quotations.reduce((sum, q) => sum + Number(q.total || 0), 0)

  return {
    total,
    active,
    expired,
    converted,
    totalValue,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    expiredPercentage: total > 0 ? Math.round((expired / total) * 100) : 0,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    convertedPercentage: total > 0 ? Math.round((converted / total) * 100) : 0,
    averageValue: converted > 0 ? totalValue / converted : 0,
  }
}

const formatCurrency = (value: number) =>
  `BOB ${value.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export function QuotationsStats({ quotations, isLoading = false }: QuotationsStatsProps) {
  const {
    total,
    active,
    expired,
    converted,
    totalValue,
    activePercentage,
    expiredPercentage,
    conversionRate,
    convertedPercentage,
    averageValue,
  } = computeStats(quotations)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Total
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {isLoading ? "--" : total.toLocaleString("es-BO")}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {isLoading
              ? "Calculando cotizaciones registradas"
              : `Activas: ${active} · Convertidas: ${converted} · Valor: ${formatCurrency(
                  totalValue,
                )}`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
            Activas
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">
            {isLoading ? "--" : active.toLocaleString("es-BO")}
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {isLoading ? "Calculando..." : `${activePercentage}% del total • Vigentes`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Convertidas
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {isLoading ? "--" : converted.toLocaleString("es-BO")}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            {isLoading ? "Calculando..." : `${conversionRate}% del total • Negocios cerrados`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Vencidas
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {isLoading ? "--" : expired.toLocaleString("es-BO")}
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            {isLoading
              ? "Calculando..."
              : `${expiredPercentage}% del total • Ticket promedio convertido: ${formatCurrency(
                  averageValue,
                )}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}