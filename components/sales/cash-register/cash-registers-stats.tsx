"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Unlock, DollarSign, Building2 } from "lucide-react"
import { CashRegister } from "@prisma/client"

interface CashRegistersStatsProps {
  cashRegisters: Array<CashRegister & { branch?: any }>
}

export function CashRegistersStats({ cashRegisters }: CashRegistersStatsProps) {
  const total = cashRegisters.length
  const open = cashRegisters.filter(cr => cr.isOpen).length
  const closed = cashRegisters.filter(cr => !cr.isOpen).length
  const totalBalance = cashRegisters
    .filter(cr => cr.isOpen)
    .reduce((sum, cr) => sum + Number(cr.currentBalance), 0)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cajas</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Cajas registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cajas Abiertas</CardTitle>
          <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{open}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En operación
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cajas Cerradas</CardTitle>
          <Lock className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closed}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Deshabilitadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${totalBalance.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En cajas abiertas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

