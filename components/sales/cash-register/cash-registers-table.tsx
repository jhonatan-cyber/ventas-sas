"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, Lock, Unlock, Building2 } from "lucide-react"
import { CashRegister } from "@prisma/client"
import { formatDate } from "@/lib/utils/date"

interface CashRegistersTableProps {
  cashRegisters: Array<CashRegister & { branch?: any }>
  isLoading?: boolean
  onEditClick?: (cashRegister: CashRegister) => void
  onOpenClick?: (cashRegister: CashRegister) => void
  onCloseClick?: (cashRegister: CashRegister) => void
  onDeleteClick?: (cashRegister: CashRegister) => void
}

export function CashRegistersTable({ 
  cashRegisters, 
  isLoading, 
  onEditClick, 
  onOpenClick,
  onCloseClick,
  onDeleteClick 
}: CashRegistersTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando cajas...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Caja</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Balance Inicial</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Balance Actual</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Última Apertura</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashRegisters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Lock className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay cajas registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cashRegisters.map((cashRegister) => {
                return (
                  <TableRow key={cashRegister.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {cashRegister.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cashRegister.branch ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{cashRegister.branch.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${Number(cashRegister.openingBalance).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${Number(cashRegister.currentBalance).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cashRegister.isOpen 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" 
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                      }>
                        {cashRegister.isOpen ? "Abierta" : "Cerrada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cashRegister.lastOpenAt ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(cashRegister.lastOpenAt)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nunca abierta</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEditClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditClick(cashRegister)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar caja</TooltipContent>
                          </Tooltip>
                        )}
                        {cashRegister.isOpen ? (
                          onCloseClick && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onCloseClick(cashRegister)}
                                  className="hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cerrar caja</TooltipContent>
                            </Tooltip>
                          )
                        ) : (
                          onOpenClick && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onOpenClick(cashRegister)}
                                  className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Abrir caja</TooltipContent>
                            </Tooltip>
                          )
                        )}
                        {onDeleteClick && !cashRegister.isOpen && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(cashRegister)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar caja</TooltipContent>
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

