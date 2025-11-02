"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, Clock, DollarSign, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { SalesExpenseWithRelations } from "./types"

interface ExpensesStatsProps {
  expenses: SalesExpenseWithRelations[]
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
    label: "Total Gastos",
    icon: FileText,
    accentColor: "text-blue-600 dark:text-blue-400",
    bgGradient: "from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
  },
  {
    key: "month",
    label: "Este Mes",
    icon: Clock,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    bgGradient: "from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
  },
  {
    key: "average",
    label: "Promedio",
    icon: CheckCircle2,
    accentColor: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700",
  },
  {
    key: "totalAmount",
    label: "Monto Total",
    icon: DollarSign,
    accentColor: "text-violet-600 dark:text-violet-400",
    bgGradient: "from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700",
  },
]

const getStats = (expenses: SalesExpenseWithRelations[]) => {
  const total = expenses.length
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthExpenses = expenses.filter((expense) => new Date(expense.date) >= startOfMonth)
  const monthAmount = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const averageAmount = total > 0 ? totalAmount / total : 0

  return {
    total,
    values: {
      total: {
        value: total,
        helper: `${monthExpenses.length} en el mes actual`,
        trend: total === 0 ? 0 : (monthExpenses.length / total) * 100,
        isPositive: true,
      },
      month: {
        value: monthExpenses.length,
        helper: `BOB ${monthAmount.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trend: totalAmount === 0 ? 0 : (monthAmount / (totalAmount || 1)) * 100,
        isPositive: true,
      },
      average: {
        value: `BOB ${averageAmount.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        helper: `${total} registros totales`,
        trend: averageAmount,
        isPositive: true,
      },
      totalAmount: {
        value: totalAmount,
        helper: `BOB ${monthAmount.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} este mes`,
        trend: totalAmount,
        isPositive: true,
      },
    },
  }
}

export function ExpensesStats({ expenses, isLoading = false }: ExpensesStatsProps) {
  const stats = getStats(expenses)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, label, icon: Icon, accentColor, bgGradient, iconBg }) => {
        const stat = stats.values[key]
        const displayValue = key === "totalAmount"
          ? `${Number(stat.value || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    {label}
                  </p>
                  {key === "total" && (
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

              <div>
                <div className={`text-2xl sm:text-3xl font-bold ${accentColor} tracking-tight flex items-baseline gap-1.5`}>
                  {isLoading ? (
                    <span className="text-gray-400">--</span>
                  ) : (
                    <>
                      {key === "totalAmount" && (
                        <span className="text-sm font-semibold">BOB</span>
                      )}
                      {displayValue}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                  {isLoading ? "Calculando..." : stat.helper}
                </p>
                {!isLoading && Number(stat.trend || 0) > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${trendColor} text-[10px] font-semibold`}>
                    <TrendIcon className="h-3 w-3" strokeWidth={3} />
                    {typeof stat.trend === "number" ? stat.trend.toFixed(1) : stat.trend}
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

