"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"
import { TrendingDown } from "lucide-react"

interface ExpensesByCategoryChartProps {
  data: Array<{
    category: string
    count: number
    amount: number
  }>
  customerSlug: string
}

const EXPENSE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'
]

export function ExpensesByCategoryChart({ data, customerSlug }: ExpensesByCategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Gastos por Categoría</CardTitle>
          <CardDescription>Distribución de gastos según categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
  }))

  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0)
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Gastos por Categoría
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de gastos según categoría
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Gastos</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{totalCount}</p>
          </div>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monto Total</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrencyWithPreferences(totalAmount, customerSlug)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {chartData.map((item, index) => (
                <linearGradient key={index} id={`expenseGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={item.color} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              opacity={0.3}
              className="dark:stroke-gray-700"
            />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
              tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'amount') {
                  return [formatCurrencyWithPreferences(value, customerSlug), 'Monto Total']
                }
                return [value.toLocaleString(), 'Cantidad de Gastos']
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="count" 
              name="Cantidad"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#expenseGradient-${index})`} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right" 
              dataKey="amount" 
              name="Monto Total"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-amount-${index}`} fill={entry.color} opacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

