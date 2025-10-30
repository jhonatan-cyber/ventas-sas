"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, CheckCircle2, XCircle, Shield } from "lucide-react"
import { UsuarioSas } from "@prisma/client"

interface UsuariosSasStatsProps {
  usuarios: UsuarioSas[]
}

export function UsuariosSasStats({ usuarios }: UsuariosSasStatsProps) {
  const total = usuarios.length
  const active = usuarios.filter(u => u.isActive).length
  const inactive = usuarios.filter(u => !u.isActive).length
  const withRole = usuarios.filter(u => u.rolId).length

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          <User className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Usuarios registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{active}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            En uso actualmente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
          <XCircle className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inactive}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Deshabilitados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Con Rol</CardTitle>
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{withRole}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Con rol asignado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

