"use client"

import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"
import { format } from "date-fns"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"

interface SalesPredictionsChartProps {
  data: Array<{
    date: string
    predicted: number
    confidence: number
    lowerBound: number
    upperBound: number
  }>
  loading: boolean
  customerSlug: string
}

export function SalesPredictionsChart({ data, loading, customerSlug }: SalesPredictionsChartProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
              <Brain className="h-5 w-5" />
              Insuficientes Datos
            </CardTitle>
            <CardDescription>
              Se necesitan al menos 7 días de datos históricos para generar predicciones.
              Continúa registrando ventas para habilitar esta funcionalidad.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const chartData = data.map(item => ({
    fecha: format(new Date(item.date), 'dd/MM'),
    prediccion: item.predicted,
    limiteInferior: item.lowerBound,
    limiteSuperior: item.upperBound,
    confianza: (item.confidence * 100).toFixed(0)
  }))

  const avgConfidence = data.reduce((sum, item) => sum + item.confidence, 0) / data.length

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <Brain className="h-5 w-5" />
            Predicciones con Machine Learning
          </CardTitle>
          <CardDescription>
            Modelo de regresión lineal basado en datos históricos. 
            Confianza promedio: {(avgConfidence * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis 
              dataKey="fecha" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => formatCurrencyWithPreferences(value, customerSlug)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'confianza') return `${value}%`
                return formatCurrencyWithPreferences(value, customerSlug)
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="limiteSuperior"
              stroke="none"
              fill="hsl(var(--muted))"
              fillOpacity={0.2}
              name="Rango Superior"
            />
            <Area
              type="monotone"
              dataKey="limiteInferior"
              stroke="none"
              fill="hsl(var(--background))"
              name="Rango Inferior"
            />
            <Line 
              type="monotone" 
              dataKey="prediccion" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Predicción"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

