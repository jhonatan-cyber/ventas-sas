"use client"

import { TrendingUp } from "lucide-react"
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface SalesByDateChartProps {
  data: Array<{
    date: string
    count: number
    revenue: number
  }>
  customerSlug: string
}

export function SalesByDateChart({ data, customerSlug }: SalesByDateChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ventas por Fecha</CardTitle>
          <CardDescription>Evolución de ventas e ingresos en el tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSales = data.reduce((sum, d) => sum + d.count, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)

  // Formatear fecha a partir de una cadena YYYY-MM-DD sin aplicar zona horaria
  const formatDateLabel = (value: string) => {
    if (!value) return ""
    const [year, month, day] = value.split("-")
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Ventas por Fecha
            </CardTitle>
            <CardDescription className="mt-1">
              Evolución de ventas e ingresos en el tiempo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Ventas</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalSales}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Ingresos</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrencyWithPreferences(totalRevenue, customerSlug)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart 
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              opacity={0.3}
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDateLabel(value as string)}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
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
                if (name === 'revenue') {
                  return [formatCurrencyWithPreferences(value, customerSlug), 'Ingresos']
                }
                return [value.toLocaleString(), 'Cantidad de Ventas']
              }}
              labelFormatter={(label) => `Fecha: ${formatDateLabel(label as string)}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Cantidad de Ventas"
              dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
              fill="url(#colorCount)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              name="Ingresos"
              dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
              fill="url(#colorRevenue)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

