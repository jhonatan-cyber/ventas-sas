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
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductsChartProps {
  data: Array<{
    productName: string
    quantitySold: number
    revenue: number
  }>
}

export function ProductsChart({ data }: ProductsChartProps) {
  // Limitar a 10 productos y ordenar por cantidad
  const displayData = data.slice(0, 10)

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" style={{ fontSize: '12px' }} />
            <YAxis
              dataKey="productName"
              type="category"
              width={150}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [formatCurrency(value), 'Ingresos']
                }
                return [value, 'Cantidad']
              }}
            />
            <Legend />
            <Bar dataKey="quantitySold" fill="#3b82f6" name="Cantidad Vendida" />
            <Bar dataKey="revenue" fill="#10b981" name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

