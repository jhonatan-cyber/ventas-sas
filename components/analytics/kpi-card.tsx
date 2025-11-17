"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  Activity 
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface KPICardProps {
  kpi: {
    id: string
    name: string
    value: number
    previousValue: number
    change: number
    changePercent: number
    format: 'currency' | 'number' | 'percentage'
    icon?: string
  }
  customerSlug: string
}

const iconMap: Record<string, any> = {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Activity,
  TrendingUp
}

export function KPICard({ kpi, customerSlug }: KPICardProps) {
  const Icon = kpi.icon ? iconMap[kpi.icon] || Activity : Activity
  
  const formatValue = (value: number) => {
    if (kpi.format === 'currency') {
      return formatCurrencyWithPreferences(value, customerSlug)
    }
    if (kpi.format === 'percentage') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString()
  }

  const isPositive = kpi.changePercent > 0
  const isNegative = kpi.changePercent < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {kpi.name}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(kpi.value)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon 
                className={`h-3 w-3 ${
                  isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : isNegative 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-400'
                }`} 
              />
              <span 
                className={`text-xs font-medium ${
                  isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : isNegative 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-400'
                }`}
              >
                {Math.abs(kpi.changePercent).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs período anterior
              </span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

