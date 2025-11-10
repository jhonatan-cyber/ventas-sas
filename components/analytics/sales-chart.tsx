"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SalesChartProps {
  data: Array<{
    date: string
    sales: number
    revenue: number
  }>
  period: 'daily' | 'weekly' | 'monthly'
}

export function SalesChart({ data, period }: SalesChartProps) {
  // Formatear fecha según período
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (period === 'daily') {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    } else if (period === 'weekly') {
      // Calcular semana del año
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
      return `Sem ${weekNumber}`
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    }
  }

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas en el Tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              style={{ fontSize: '12px' }}
            />
            <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [formatCurrency(value), 'Ingresos']
                }
                return [value, 'Ventas']
              }}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Ventas"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Ingresos"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

