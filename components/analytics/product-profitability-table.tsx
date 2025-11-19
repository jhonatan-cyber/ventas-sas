"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface ProductProfitabilityTableProps {
  data: Array<{
    productId: string
    productName: string
    totalRevenue: number
    totalCost: number
    profit: number
    profitMargin: number
    unitsSold: number
    averagePrice: number
  }>
  loading: boolean
  customerSlug: string
}

export function ProductProfitabilityTable({ data, loading, customerSlug }: ProductProfitabilityTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        No hay datos disponibles para mostrar
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Unidades Vendidas</TableHead>
            <TableHead className="text-right">Ingresos</TableHead>
            <TableHead className="text-right">Costos</TableHead>
            <TableHead className="text-right">Ganancia</TableHead>
            <TableHead className="text-right">Margen %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((product) => (
            <TableRow key={product.productId}>
              <TableCell className="font-medium">{product.productName}</TableCell>
              <TableCell className="text-right">{product.unitsSold.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                {formatCurrencyWithPreferences(product.totalRevenue, customerSlug)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrencyWithPreferences(product.totalCost, customerSlug)}
              </TableCell>
              <TableCell className="text-right">
                <span className={product.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {formatCurrencyWithPreferences(product.profit, customerSlug)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={product.profitMargin >= 20 ? 'default' : product.profitMargin >= 10 ? 'secondary' : 'destructive'}
                >
                  {product.profitMargin.toFixed(1)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

