"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences"

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: number
    expenses?: number
    profit?: number
  }>
  slug?: string
}

export function RevenueChart({ data, slug }: RevenueChartProps) {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    return formatDateWithPreferences(dateStr, slug)
  }

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return formatCurrencyWithPreferences(value, slug)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  revenue: 'Ingresos',
                  expenses: 'Gastos',
                  profit: 'Ganancia',
                }
                return [formatCurrency(value), labels[name] || name]
              }}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Ingresos"
            />
            {data.some((d) => d.expenses !== undefined) && (
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name="Gastos"
              />
            )}
            {data.some((d) => d.profit !== undefined) && (
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorProfit)"
                name="Ganancia"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

