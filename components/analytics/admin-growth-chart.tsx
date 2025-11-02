"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AdminGrowthChartProps {
  data: Array<{
    date: string
    count: number
  }>
}

export function AdminGrowthChart({ data }: AdminGrowthChartProps) {
  // Formatear fecha (mes)
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${month}/${year}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crecimiento de Organizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value: number) => [value, 'Organizaciones']}
              labelFormatter={(label) => formatDate(label)}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Organizaciones"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

