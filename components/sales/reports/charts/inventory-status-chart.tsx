"use client"

import { AlertTriangle } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface InventoryStatusChartProps {
  activeProducts: number
  inactiveProducts: number
  lowStockProducts: number
  outOfStockProducts: number
}

const COLORS = {
  'Activos': '#10b981',
  'Inactivos': '#6b7280',
  'Stock Bajo': '#f59e0b',
  'Sin Stock': '#ef4444',
}

export function InventoryStatusChart({
  activeProducts,
  inactiveProducts,
  lowStockProducts,
  outOfStockProducts,
}: InventoryStatusChartProps) {
  const data = [
    { name: 'Activos', value: activeProducts, color: COLORS['Activos'] },
    { name: 'Inactivos', value: inactiveProducts, color: COLORS['Inactivos'] },
    { name: 'Stock Bajo', value: lowStockProducts, color: COLORS['Stock Bajo'] },
    { name: 'Sin Stock', value: outOfStockProducts, color: COLORS['Sin Stock'] },
  ].filter(item => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Estado del Inventario</CardTitle>
          <CardDescription>Distribución de productos por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Estado del Inventario
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de productos por estado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total de Productos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <defs>
              {data.map((entry, index) => (
                <filter key={index} id={`shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                </filter>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const name = props.name || ''
                const value = props.value || 0
                const percent = props.percent || 0
                if (percent < 0.05) return '' // Ocultar etiquetas muy pequeñas
                return `${name}\n${value} (${(percent * 100).toFixed(1)}%)`
              }}
              outerRadius={100}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  filter={`url(#shadow-${index})`}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => {
                const percent = ((value / total) * 100).toFixed(1)
                return [`${value.toLocaleString()} productos (${percent}%)`, name]
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

