"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, Clock, DollarSign, TrendingUp, TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

interface QuotationsStatsProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
}

interface StatCardConfig {
  key: keyof ReturnType<typeof getStats>["values"]
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accentColor: string
  bgGradient: string
  iconBg: string
}

const statCards: StatCardConfig[] = [
  {
    key: "total",
    label: "Total Cotizaciones",
    icon: FileText,
    accentColor: "text-blue-600 dark:text-blue-400",
    bgGradient: "from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
  },
  {
    key: "active",
    label: "Activas",
    icon: Clock,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    bgGradient: "from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
  },
  {
    key: "expired",
    label: "Vencidas",
    icon: CheckCircle2,
    accentColor: "text-rose-600 dark:text-rose-400",
    bgGradient: "from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700",
  },
  {
    key: "totalValue",
    label: "Valor Total",
    icon: DollarSign,
    accentColor: "text-violet-600 dark:text-violet-400",
    bgGradient: "from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700",
  },
]

const getStats = (quotations: SalesQuotationWithRelations[]) => {
  const total = quotations.length
  const active = quotations.filter((q) => q.status === 'active').length
  const expired = quotations.filter((q) => q.status === 'expired').length
  const totalValue = quotations
    .filter((q) => q.status === 'active')
    .reduce((sum, q) => sum + Number(q.total || 0), 0)
  const activeRate = total === 0 ? 0 : (active / total) * 100
  const expiredRate = total === 0 ? 0 : (expired / total) * 100
  const averageValue = active > 0 ? totalValue / active : 0

  return {
    total,
    values: {
      total: {
        value: total,
        helper: `${active} activas, ${expired} vencidas`,
        trend: activeRate,
        isPositive: activeRate >= 50,
      },
      active: {
        value: active,
        helper: `${activeRate.toFixed(1)}% del total`,
        trend: activeRate,
        isPositive: true,
      },
      expired: {
        value: expired,
        helper: `${expiredRate.toFixed(1)}% del total`,
        trend: expiredRate,
        isPositive: false,
      },
      totalValue: {
        value: totalValue,
        helper: `Promedio: BOB ${averageValue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trend: totalValue > 0 ? 100 : 0,
        isPositive: true,
      },
    },
  }
}

export function QuotationsStats({ quotations, isLoading = false }: QuotationsStatsProps) {
  const stats = getStats(quotations)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, label, icon: Icon, accentColor, bgGradient, iconBg }) => {
        const stat = stats.values[key]
        const displayValue =
          key === 'totalValue'
            ? `${Number(stat.value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : stat.value

        const TrendIcon = stat.isPositive ? ArrowUpRight : ArrowDownRight
        const trendColor = stat.isPositive 
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" 
          : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"

        return (
          <Card
            key={key}
            className={`relative overflow-hidden border border-gray-200/60 dark:border-gray-800/60 
              bg-gradient-to-br ${bgGradient} backdrop-blur-sm
              hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20
              transition-all duration-300 hover:-translate-y-0.5`}
          >
            <CardContent className="relative p-4 sm:p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    {label}
                  </p>
                  {key === 'total' && (
                    <Badge 
                      variant="secondary" 
                      className="mt-1 text-[9px] font-medium px-2 py-0.5 bg-white/60 dark:bg-white/10 border-0"
                    >
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      Panorama General
                    </Badge>
                  )}
                </div>
                <div className={`${iconBg} w-10 h-10 rounded-xl shadow-lg flex items-center justify-center`}>
                  <Icon className="h-4.5 w-4.5 text-white" strokeWidth={2.3} />
                </div>
              </div>

              {/* Main Value */}
              <div>
                <div className={`text-2xl sm:text-3xl font-bold ${accentColor} tracking-tight flex items-baseline gap-1.5`}>
                  {isLoading ? (
                    <span className="text-gray-400">--</span>
                  ) : (
                    <>
                      {key === 'totalValue' && (
                        <span className="text-sm font-semibold">BOB</span>
                      )}
                      {displayValue}
                    </>
                  )}
                </div>
              </div>

              {/* Helper Text & Trend */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                  {isLoading ? 'Calculando...' : stat.helper}
                </p>
                {!isLoading && stat.trend > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${trendColor} text-[10px] font-semibold`}>
                    <TrendIcon className="h-3 w-3" strokeWidth={3} />
                    {stat.trend.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}