"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle2, XCircle } from "lucide-react"
import { SalesCustomer } from "@prisma/client"

interface SalesCustomersStatsProps {
  customers: SalesCustomer[]
}

export function SalesCustomersStats({ customers }: SalesCustomersStatsProps) {
  const total = customers.length
  const active = customers.filter(c => c.isActive).length
  const inactive = customers.filter(c => !c.isActive).length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border border-gray-200/60 dark:border-[#2a2a2a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4" style={{ color: "var(--primary)" }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Clientes registrados
          </p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/60 dark:border-[#2a2a2a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <CheckCircle2 className="h-4 w-4" style={{ color: "color-mix(in oklch, var(--primary) 75%, white)" }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{active}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En uso actualmente
          </p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/60 dark:border-[#2a2a2a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Inactivos</CardTitle>
          <XCircle className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{inactive}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Deshabilitados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

