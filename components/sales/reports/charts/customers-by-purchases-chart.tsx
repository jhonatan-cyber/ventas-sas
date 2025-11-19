"use client"

import { Users } from "lucide-react"
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

interface CustomersByPurchasesChartProps {
  data: Array<{
    range: string
    count: number
  }>
}

const PURCHASE_COLORS = [
  '#8b5cf6', '#a855f7', '#c084fc', '#d946ef', '#ec4899'
]

export function CustomersByPurchasesChart({ data }: CustomersByPurchasesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Clientes por Cantidad de Compras</CardTitle>
          <CardDescription>Distribución de clientes según frecuencia de compras</CardDescription>
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
    color: PURCHASE_COLORS[index % PURCHASE_COLORS.length]
  }))

  const totalCustomers = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Clientes por Cantidad de Compras
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de clientes según frecuencia de compras
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total de Clientes</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalCustomers.toLocaleString()}</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {chartData.map((item, index) => (
                <linearGradient key={index} id={`purchaseGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
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
              dataKey="range" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
            />
            <YAxis 
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
              formatter={(value: number) => [`${value.toLocaleString()} clientes`, 'Cantidad']}
            />
            <Legend />
            <Bar 
              dataKey="count" 
              name="Cantidad de Clientes"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#purchaseGradient-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

