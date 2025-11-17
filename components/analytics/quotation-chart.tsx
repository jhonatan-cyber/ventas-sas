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
import { formatDateWithPreferences } from "@/lib/utils/preferences"

interface QuotationChartProps {
  data: Array<{
    date: string
    created: number
    converted: number
    expired: number
  }>
  slug?: string
}

export function QuotationChart({ data, slug }: QuotationChartProps) {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    return formatDateWithPreferences(dateStr, slug)
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

