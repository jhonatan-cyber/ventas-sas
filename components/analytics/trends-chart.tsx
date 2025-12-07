"use client"

import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

import { Skeleton } from "@/components/ui/skeleton"

interface TrendsChartProps {
  data: Array<{ date: string; value: number; label?: string }>
  loading: boolean
  customerSlug: string
}

export function TrendsChart({ data, loading }: TrendsChartProps) {
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
    <div className="w-full" style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="fecha" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
          />
          <Line 
            type="monotone" 
            dataKey="ventas" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Ventas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
