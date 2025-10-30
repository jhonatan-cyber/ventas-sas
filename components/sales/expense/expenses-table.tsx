"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, DollarSign } from "lucide-react"
import { Expense } from "@prisma/client"
import { formatDate } from "@/lib/utils/date"

interface ExpensesTableProps {
  expenses: Array<Expense & { user?: any }>
  isLoading?: boolean
  onEditClick?: (expense: Expense) => void
  onDeleteClick?: (expense: Expense) => void
}

export function ExpensesTable({ expenses, isLoading, onEditClick, onDeleteClick }: ExpensesTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando gastos...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Fecha</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Categoría</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Descripción</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Usuario</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Monto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
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
                        {formatDate(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {expense.user?.fullName || 'Usuario no encontrado'}
                      </div>
                      {expense.user?.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.user.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        ${Number(expense.amount).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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

