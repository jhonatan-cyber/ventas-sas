"use client"

import { Branch } from "@prisma/client"
import { Building2, CheckCircle2, XCircle, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BranchesStatsProps {
  branches: (Branch & {
    _count?: { usuariosSas: number }
  })[]
}

export function BranchesStats({ branches }: BranchesStatsProps) {
  const total = branches.length
  const active = branches.filter(b => b.isActive).length
  const inactive = branches.filter(b => !b.isActive).length
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0
  const inactivePercentage = total > 0 ? Math.round((inactive / total) * 100) : 0
  const totalUsers = branches.reduce((acc, branch) => acc + (branch._count?.usuariosSas || 0), 0)

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">
            Total Sucursales
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{total}</div>
          <p className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300 mt-1 line-clamp-2">
            Sucursales registradas en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
            Sucursales Activas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{active}</div>
          <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
            {activePercentage}% del total • En operación actualmente
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
            Sucursales Inactivas
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{inactive}</div>
          <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            {inactivePercentage}% del total • Deshabilitadas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
            Usuarios Asignados
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{totalUsers}</div>
          <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2">
            Usuarios asignados a sucursales
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

