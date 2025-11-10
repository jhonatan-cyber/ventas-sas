"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ComparisonCardProps {
  title: string
  current: number
  previous: number
  format?: 'number' | 'currency'
  icon?: React.ReactNode
}

export function ComparisonCard({
  title,
  current,
  previous,
  format = 'number',
  icon,
}: ComparisonCardProps) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0
  const isPositive = change >= 0

  const formatValue = (value: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 0,
      }).format(value)
    }
    return value.toLocaleString('es-BO')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(current)}</div>
        <div className="flex items-center gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            vs período anterior
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Anterior: {formatValue(previous)}
        </p>
      </CardContent>
    </Card>
  )
}

