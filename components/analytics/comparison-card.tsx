"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface ComparisonCardProps {
  title: string
  current: number
  previous: number
  format?: 'number' | 'currency'
  icon?: React.ReactNode
  slug?: string
}

export function ComparisonCard({
  title,
  current,
  previous,
  format = 'number',
  icon,
  slug,
}: ComparisonCardProps) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0
  const isPositive = change >= 0

  const formatValue = (value: number) => {
    if (format === 'currency') {
      return formatCurrencyWithPreferences(value, slug)
    }
    return value.toLocaleString('es-BO')
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{title}</CardTitle>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
          {formatValue(current)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
          )}
          <span
            className={`text-xs sm:text-sm font-semibold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            vs anterior
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
          Anterior: <span className="font-medium">{formatValue(previous)}</span>
        </p>
      </CardContent>
    </Card>
  )
}

