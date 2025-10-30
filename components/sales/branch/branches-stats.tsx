"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { Branch } from "@prisma/client"

interface BranchesStatsProps {
  branches: Branch[]
}

export function BranchesStats({ branches }: BranchesStatsProps) {
  const total = branches.length
  const active = branches.filter(b => b.isActive).length
  const inactive = branches.filter(b => !b.isActive).length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sucursales</CardTitle>
          <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Sucursales registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sucursales Activas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{active}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En operación actualmente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sucursales Inactivas</CardTitle>
          <XCircle className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inactive}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Deshabilitadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

