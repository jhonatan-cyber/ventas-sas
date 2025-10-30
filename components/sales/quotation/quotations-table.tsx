"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, FileText, Check, X } from "lucide-react"
import { Quotation } from "@prisma/client"
// Función simple para formatear fechas
const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface QuotationsTableProps {
  quotations: Array<Quotation & { customer?: any; items?: any[] }>
  isLoading?: boolean
  onEditClick?: (quotation: Quotation) => void
  onDeleteClick?: (quotation: Quotation) => void
  onStatusChange?: (quotation: Quotation, newStatus: string) => void
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  converted: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  converted: "Convertida",
  expired: "Expirada"
}

export function QuotationsTable({ quotations, isLoading, onEditClick, onDeleteClick, onStatusChange }: QuotationsTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando cotizaciones...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Número</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Fecha</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Items</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Total</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay cotizaciones registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => {
                const totalItems = quotation.items?.length || 0
                const totalQuantity = quotation.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                
                return (
                  <TableRow key={quotation.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {quotation.quotationNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {quotation.customer?.name || 'Cliente no encontrado'}
                        </span>
                        {quotation.customer?.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{quotation.customer.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(quotation.createdAt)}
                      </div>
                      {quotation.expiresAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Vence: {formatDate(quotation.expiresAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {totalItems} producto{totalItems !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {totalQuantity} unidad{totalQuantity !== 1 ? 'es' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${Number(quotation.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                      {quotation.discount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Desc: ${Number(quotation.discount).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[quotation.status] || statusColors.pending}>
                        {statusLabels[quotation.status] || quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEditClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditClick(quotation)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar cotización</TooltipContent>
                          </Tooltip>
                        )}
                        {onStatusChange && quotation.status === 'pending' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(quotation, 'approved')}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Aprobar cotización</TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(quotation)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar cotización</TooltipContent>
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

