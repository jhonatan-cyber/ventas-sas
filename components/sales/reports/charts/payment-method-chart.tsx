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
import { CreditCard } from "lucide-react"

interface PaymentMethodChartProps {
  data: {
    cash: { count: number; amount: number }
    card: { count: number; amount: number }
    transfer: { count: number; amount: number }
    qr: { count: number; amount: number }
  }
  customerSlug: string
}

const METHOD_COLORS = {
  'Efectivo': '#10b981',
  'Tarjeta': '#3b82f6',
  'Transferencia': '#8b5cf6',
  'QR / Billetera': '#f59e0b',
}

export function PaymentMethodChart({ data, customerSlug }: PaymentMethodChartProps) {
  const chartData = [
    {
      name: 'Efectivo',
      cantidad: data.cash.count,
      monto: data.cash.amount,
      color: METHOD_COLORS['Efectivo'],
    },
    {
      name: 'Tarjeta',
      cantidad: data.card.count,
      monto: data.card.amount,
      color: METHOD_COLORS['Tarjeta'],
    },
    {
      name: 'Transferencia',
      cantidad: data.transfer.count,
      monto: data.transfer.amount,
      color: METHOD_COLORS['Transferencia'],
    },
    {
      name: 'QR / Billetera',
      cantidad: data.qr.count,
      monto: data.qr.amount,
      color: METHOD_COLORS['QR / Billetera'],
    },
  ].filter(item => item.cantidad > 0 || item.monto > 0)

  if (chartData.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ventas por Método de Pago</CardTitle>
          <CardDescription>Distribución de ventas según método de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.monto, 0)
  const totalCount = chartData.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Ventas por Método de Pago
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de ventas según método de pago
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transacciones</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{totalCount}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monto Total</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrencyWithPreferences(totalAmount, customerSlug)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {Object.entries(METHOD_COLORS).map(([name, color]) => (
                <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.3} />
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
              dataKey="name" 
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
                if (name === 'monto') {
                  return [formatCurrencyWithPreferences(value, customerSlug), 'Monto Total']
                }
                return [value.toLocaleString(), 'Cantidad de Transacciones']
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="cantidad" 
              name="Cantidad"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#gradient-${entry.name})`} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right" 
              dataKey="monto" 
              name="Monto Total"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-revenue-${index}`} fill={entry.color} opacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

