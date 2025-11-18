"use client"

import { SalesExpenseWithRelations } from "./types"
import { Edit, Trash2, MoreVertical, Calendar, Building2, User, FileText, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatDateWithPreferences, formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface ExpensesCardsProps {
  expenses: SalesExpenseWithRelations[]
  onEdit?: (expense: SalesExpenseWithRelations) => void
  onDelete?: (expense: SalesExpenseWithRelations) => void
  onView?: (expense: SalesExpenseWithRelations) => void
}

export function ExpensesCards({ expenses, onEdit, onDelete, onView }: ExpensesCardsProps) {
  if (expenses.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {expenses.map((expense) => {
        return (
          <Card key={expense.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header con concepto, badge y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {expense.name}
                        </span>
                        {expense.category && (
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1 py-0 shrink-0">
                            {expense.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(expense)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                          <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <>
                          {onView && <DropdownMenuSeparator />}
                          <DropdownMenuItem onClick={() => onEdit(expense)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                            <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          {(onView || onEdit) && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            onClick={() => onDelete(expense)}
                            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                            <span className="text-red-600 dark:text-red-400">Eliminar</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Monto destacado */}
                <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Monto</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatCurrencyWithPreferences(Number(expense.amount))}
                    </span>
                  </div>
                </div>

                {/* Información detallada */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{formatDateWithPreferences(expense.date)}</span>
                  </div>
                  {expense.branch && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{expense.branch.name}</span>
                    </div>
                  )}
                  {expense.user && (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{expense.user.fullName || "Usuario"}</span>
                    </div>
                  )}
                  {expense.description && (
                    <div className="flex items-start gap-2 col-span-2">
                      <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{expense.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

