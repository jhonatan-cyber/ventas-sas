"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface CustomerSegmentationChartProps {
  data: Array<{
    segment: string
    count: number
    totalRevenue: number
    averageOrderValue: number
    description: string
  }>
  loading: boolean
  customerSlug: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function CustomerSegmentationChart({ data, loading, customerSlug }: CustomerSegmentationChartProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        No hay datos disponibles para mostrar
      </div>
    )
  }

  const chartData = data.map((item, index) => ({
    name: item.segment,
    value: item.count,
    revenue: item.totalRevenue,
    avgOrder: item.averageOrderValue,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="space-y-4">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((segment, index) => (
          <Card key={segment.segment} className="border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                {segment.segment}
              </CardTitle>
              <CardDescription className="text-xs">
                {segment.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {segment.count}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyWithPreferences(segment.totalRevenue, customerSlug)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Promedio de Orden</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyWithPreferences(segment.averageOrderValue, customerSlug)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

