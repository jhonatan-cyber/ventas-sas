"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"
import { format } from "date-fns"

interface TrendsChartProps {
  data: Array<{ date: string; value: number; label?: string }>
  loading: boolean
  customerSlug: string
}

export function TrendsChart({ data, loading, customerSlug }: TrendsChartProps) {
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

  const chartData = data.map(item => ({
    fecha: item.label || format(new Date(item.date), 'dd/MM'),
    ventas: item.value
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis 
            dataKey="fecha" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => formatCurrencyWithPreferences(value, customerSlug)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px'
            }}
            formatter={(value: number) => formatCurrencyWithPreferences(value, customerSlug)}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="ventas" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Ventas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

