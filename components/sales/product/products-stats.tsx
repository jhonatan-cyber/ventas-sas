"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle2, XCircle, AlertTriangle, DollarSign } from "lucide-react"
import { SalesProduct, Branch } from "@prisma/client"

interface ProductsStatsProps {
  products: (SalesProduct & { branch: Branch | null })[]
}

export function ProductsStats({ products }: ProductsStatsProps) {
  const total = products.length
  const active = products.filter(p => p.isActive).length
  const inactive = products.filter(p => !p.isActive).length
  const lowStock = products.filter(p => p.stock <= p.minStock && p.isActive).length
  const totalValue = products
    .filter(p => p.isActive)
    .reduce((sum, p) => sum + (Number(p.price) * p.stock), 0)
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0
  const inactivePercentage = total > 0 ? Math.round((inactive / total) * 100) : 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Total Productos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{total}</div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            Productos registrados en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
            Productos Activos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{active}</div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {activePercentage}% del total • En inventario
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Productos Inactivos
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{inactive}</div>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            {inactivePercentage}% del total • Deshabilitados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Stock Bajo
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{lowStock}</div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            Necesitan reposición urgente
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Valor Total Activo
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">${totalValue.toLocaleString()}</div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Solo productos activos contabilizados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

