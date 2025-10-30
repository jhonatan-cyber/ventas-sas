"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, TrendingUp, Calendar } from "lucide-react"
import { Expense } from "@prisma/client"

interface ExpensesStatsProps {
  expenses: Array<Expense & { user?: any }>
}

export function ExpensesStats({ expenses }: ExpensesStatsProps) {
  const total = expenses.length
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  // Gastos del mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth)
  const thisMonthAmount = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
          <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Gastos registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monto</CardTitle>
          <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Monto total gastado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{thisMonthExpenses.length}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En el mes actual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto del Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ${thisMonthAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Gastado este mes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

