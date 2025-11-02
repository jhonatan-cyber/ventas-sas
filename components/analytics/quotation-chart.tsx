"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface QuotationChartProps {
  data: Array<{
    date: string
    created: number
    converted: number
    expired: number
  }>
}

export function QuotationChart({ data }: QuotationChartProps) {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Cotizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  created: 'Creadas',
                  converted: 'Convertidas',
                  expired: 'Expiradas',
                }
                return [value, labels[name] || name]
              }}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Bar dataKey="created" fill="#3b82f6" name="Creadas" />
            <Bar dataKey="converted" fill="#10b981" name="Convertidas" />
            <Bar dataKey="expired" fill="#ef4444" name="Expiradas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

