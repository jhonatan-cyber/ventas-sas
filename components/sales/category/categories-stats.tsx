"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, FolderOpen, CheckCircle2, XCircle } from "lucide-react"
import { Category } from "@prisma/client"

interface CategoriesStatsProps {
  categories: Category[]
}

export function CategoriesStats({ categories }: CategoriesStatsProps) {
  const total = categories.length
  const active = categories.filter(c => c.isActive).length
  const inactive = categories.filter(c => !c.isActive).length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
          <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Categorías registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
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
          <CardTitle className="text-sm font-medium">Categorías Inactivas</CardTitle>
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

