"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle2, XCircle, Users } from "lucide-react"
import { RoleSas } from "@prisma/client"

interface RolesSasStatsProps {
  roles: RoleSas[]
}

export function RolesSasStats({ roles }: RolesSasStatsProps) {
  const total = roles.length
  const active = roles.filter(r => r.isActive).length
  const inactive = roles.filter(r => !r.isActive).length
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Total Roles
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Roles registrados en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
            Roles Activos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{active}</div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {activePercentage}% del total • En uso actualmente
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Roles Inactivos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{inactive}</div>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            {total > 0 ? Math.round((inactive / total) * 100) : 0}% del total • Deshabilitados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Usuarios Asignados
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {roles.reduce((acc, role) => acc + (role._count?.usuariosSas || 0), 0)}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            Usuarios con roles asignados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

