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

interface BranchPerformanceChartProps {
  data: Array<{
    branchId: string
    branchName: string
    salesCount: number
    revenue: number
    averageTicket: number
    contribution: number
  }>
  currencyCode?: string
}

const BRANCH_COLORS = [
  "#0ea5e9",
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#e11d48",
  "#a855f7",
  "#14b8a6",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
]

export function BranchesPerformanceChart({ data, currencyCode = "Bs" }: BranchPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Desempeño por Sucursal</CardTitle>
          <CardDescription>Ventas e ingresos por sucursal</CardDescription>
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
    revenueFormatted: item.revenue,
    color: BRANCH_COLORS[index % BRANCH_COLORS.length],
  }))

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
  const totalSales = chartData.reduce((sum, item) => sum + item.salesCount, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-sky-500" />
              Desempeño por Sucursal
            </CardTitle>
            <CardDescription className="mt-1">
              Ingresos y cantidad de ventas por sucursal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
              {totalRevenue.toLocaleString("es-BO")} {currencyCode}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Ventas Totales</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalSales.toLocaleString("es-BO")}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {chartData.map((item, index) => (
                <linearGradient key={index} id={`branchPerfGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
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
              tick={{ fontSize: 11, fill: "#6b7280" }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
              tickFormatter={(value) => (value.length > 18 ? `${value.substring(0, 18)}...` : value)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              stroke="#9ca3af"
              className="dark:stroke-gray-600"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Ingresos") {
                  return [`${value.toLocaleString("es-BO")} ${currencyCode}`, "Ingresos"]
                }
                if (name === "Ventas") {
                  return [`${value.toLocaleString("es-BO")}`, "Ventas"]
                }
                return [value, name]
              }}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              name="Ingresos"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-revenue-${index}`} fill={`url(#branchPerfGradient-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


