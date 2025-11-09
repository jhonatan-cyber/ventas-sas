"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, CheckCircle2, XCircle, Package } from "lucide-react"
import { Category } from "@prisma/client"

interface CategoriesStatsProps {
  categories: (Category & {
    _count?: { products: number }
  })[]
}

export function CategoriesStats({ categories }: CategoriesStatsProps) {
  const total = categories.length
  const active = categories.filter(c => c.isActive).length
  const inactive = categories.filter(c => !c.isActive).length
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0
  const totalProducts = categories.reduce((acc, cat) => acc + (cat._count?.products || 0), 0)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
            Total Categorías
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <Folder className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{total}</div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Categorías registradas en el sistema
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Categorías Activas
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{active}</div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {activePercentage}% del total • En uso actualmente
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Categorías Inactivas
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{inactive}</div>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            {total > 0 ? Math.round((inactive / total) * 100) : 0}% del total • Deshabilitadas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Productos Asociados
          </CardTitle>
          <div className="h-10 w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {totalProducts}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            Productos con categorías asignadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

