"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, DollarSign, CheckCircle2, Clock } from "lucide-react"
import { Quotation } from "@prisma/client"

interface QuotationsStatsProps {
  quotations: Array<Quotation & { customer?: any; items?: any[] }>
}

export function QuotationsStats({ quotations }: QuotationsStatsProps) {
  const total = quotations.length
  const pending = quotations.filter(q => q.status === 'pending').length
  const approved = quotations.filter(q => q.status === 'approved').length
  const totalValue = quotations.reduce((sum, q) => sum + Number(q.total), 0)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Cotizaciones registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Esperando aprobación
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approved}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Aprobadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Valor total en cotizaciones
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

