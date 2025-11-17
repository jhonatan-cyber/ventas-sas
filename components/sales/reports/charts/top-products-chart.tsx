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
import { Package } from "lucide-react"

interface TopProductsChartProps {
  data: Array<{
    productName: string
    quantitySold: number
    revenue: number
  }>
  customerSlug: string
}

const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
]

export function TopProductsChart({ data, customerSlug }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Productos Más Vendidos</CardTitle>
          <CardDescription>Top productos por cantidad vendida e ingresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayData = data.slice(0, 10).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }))

  const totalRevenue = displayData.reduce((sum, item) => sum + item.revenue, 0)
  const totalQuantity = displayData.reduce((sum, item) => sum + item.quantitySold, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription className="mt-1">
              Top productos por cantidad vendida e ingresos generados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Unidades</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalQuantity.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Ingresos</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrencyWithPreferences(totalRevenue, customerSlug)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={displayData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.5} />
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
              type="number" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
            />
            <YAxis
              dataKey="productName"
              type="category"
              width={180}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
              tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
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
                return [value.toLocaleString(), 'Cantidad Vendida']
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="quantitySold" 
              name="Cantidad Vendida"
              radius={[0, 8, 8, 0]}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
              ))}
            </Bar>
            <Bar 
              dataKey="revenue" 
              name="Ingresos"
              radius={[0, 8, 8, 0]}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-revenue-${index}`} fill={entry.color} opacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

