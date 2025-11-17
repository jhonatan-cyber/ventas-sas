"use client"

import { Lock, Unlock, DollarSign, Building2 } from "lucide-react"

import type { CashRegisterWithRelations } from "./types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface CashRegistersStatsProps {
  cashRegisters: CashRegisterWithRelations[]
  isLoading?: boolean
}

export function CashRegistersStats({ cashRegisters, isLoading = false }: CashRegistersStatsProps) {
  const total = cashRegisters.length
  const open = cashRegisters.filter(cr => cr.isOpen).length
  const closed = cashRegisters.filter(cr => !cr.isOpen).length
  const totalBalance = cashRegisters
    .filter(cr => cr.isOpen)
    .reduce((sum, cr) => sum + Number(cr.currentBalance), 0)

  const formatCurrency = (value: number) => formatCurrencyWithPreferences(value)

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
            Total Cajas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
            {isLoading ? "--" : total.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2">
            Cajas registradas en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
            Cajas Abiertas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <Unlock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
            {isLoading ? "--" : open.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
            {isLoading ? "Calculando..." : `${total > 0 ? Math.round((open / total) * 100) : 0}% del total • En operación`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
            Cajas Cerradas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? "--" : closed.toLocaleString("es-BO")}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            {isLoading ? "Calculando..." : `${total > 0 ? Math.round((closed / total) * 100) : 0}% del total • Deshabilitadas`}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/20 border-violet-200 dark:border-violet-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-violet-900 dark:text-violet-100">
            Balance Total
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-violet-500 dark:bg-violet-600 flex items-center justify-center">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-base sm:text-lg md:text-xl font-bold text-violet-900 dark:text-violet-100 break-words">
            {isLoading ? "--" : formatCurrency(totalBalance)}
          </div>
          <p className="text-[10px] sm:text-xs text-violet-700 dark:text-violet-300 mt-1 line-clamp-2">
            {isLoading ? "Calculando..." : `En ${open} ${open === 1 ? 'caja abierta' : 'cajas abiertas'}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

