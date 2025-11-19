"use client"

import { Building2 } from "lucide-react"
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

interface CashRegistersByBranchChartProps {
  data: Array<{
    branchName: string
    cashRegisterCount: number
  }>
}

const BRANCH_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b'
]

export function CashRegistersByBranchChart({ data }: CashRegistersByBranchChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cajas por Sucursal</CardTitle>
          <CardDescription>Distribución de cajas registradoras por sucursal</CardDescription>
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
    color: BRANCH_COLORS[index % BRANCH_COLORS.length]
  }))

  const totalCashRegisters = chartData.reduce((sum, item) => sum + item.cashRegisterCount, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Cajas por Sucursal
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de cajas registradoras por sucursal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total de Cajas</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalCashRegisters.toLocaleString()}</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {chartData.map((item, index) => (
                <linearGradient key={index} id={`branchGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
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
              dataKey="branchName" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
              tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
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
              formatter={(value: number) => [`${value.toLocaleString()} cajas`, 'Cantidad']}
            />
            <Legend />
            <Bar 
              dataKey="cashRegisterCount" 
              name="Cantidad de Cajas"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#branchGradient-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

