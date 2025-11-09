"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesExpenseWithRelations } from "./types"
import { FileText, CalendarDays, GaugeCircle, DollarSign } from "lucide-react"

interface ExpensesStatsProps {
  expenses: SalesExpenseWithRelations[]
  isLoading?: boolean
}

export function ExpensesStats({ expenses, isLoading = false }: ExpensesStatsProps) {
  const totalExpenses = expenses.length
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthExpenses = expenses.filter((expense) => new Date(expense.date) >= startOfMonth)
  const monthAmount = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Total Gastos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {isLoading ? "--" : totalExpenses}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Registros de gastos en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            Gastos del Mes
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            {isLoading ? "--" : monthExpenses.length}
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            BOB {isLoading ? "--" : monthAmount.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} en el mes
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Promedio por Gasto
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center">
            <GaugeCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
            {isLoading
              ? "--"
              : `BOB ${averageAmount.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {isLoading ? "" : `${totalExpenses} registros considerados`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/20 border-violet-200 dark:border-violet-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-violet-900 dark:text-violet-100">
            Monto Total
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-violet-500 dark:bg-violet-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">
            {isLoading
              ? "--"
              : `BOB ${totalAmount.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
          <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
            Suma total de gastos registrados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

