"use client"

import { Edit, Trash2, DollarSign, Eye } from "lucide-react"

import { SalesExpenseWithRelations, ExpenseBranchSummary } from "./types"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateWithPreferences, formatCurrencyWithPreferences } from "@/lib/utils/preferences"
interface ExpensesTableProps {
  expenses: SalesExpenseWithRelations[]
  isLoading?: boolean
  branches?: ExpenseBranchSummary[]
  maxBranches?: number | null
  onEditClick?: (expense: SalesExpenseWithRelations) => void
  onDeleteClick?: (expense: SalesExpenseWithRelations) => void
  onViewClick?: (expense: SalesExpenseWithRelations) => void
}

export function ExpensesTable({ expenses, isLoading, branches = [], maxBranches, onEditClick, onDeleteClick, onViewClick }: ExpensesTableProps) {
  // Ocultar columna de sucursal si el plan solo permite una y solo hay una disponible
  const shouldHideBranchColumn = maxBranches === 1 && branches.length === 1
  const columnCount = shouldHideBranchColumn ? 6 : 7 // Sin columna sucursal: 6, con columna sucursal: 7

  if (isLoading) {
    return <TableSkeleton columns={columnCount} rows={5} showActions={true} />
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Fecha</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Concepto</TableHead>
              {!shouldHideBranchColumn && (
                <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>
              )}
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Descripción</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Registrado por</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Monto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay gastos registrados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => {
                return (
                  <TableRow key={expense.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateWithPreferences(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {expense.name}
                      </div>
                      {expense.category && (
                        <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {expense.category}
                        </span>
                      )}
                    </TableCell>
                    {!shouldHideBranchColumn && (
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
                          {expense.branch?.name ?? 'Sin sucursal'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {expense.description || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {expense.user?.fullName || 'Usuario no asignado'}
                      </div>
                      {expense.user?.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.user.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrencyWithPreferences(Number(expense.amount))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onViewClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewClick(expense)}
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalles</TooltipContent>
                          </Tooltip>
                        )}
                        {onEditClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditClick(expense)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar gasto</TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(expense)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar gasto</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

