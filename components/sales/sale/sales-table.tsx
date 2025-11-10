"use client"

import { Eye, Pencil, Trash2, Receipt, Ban } from "lucide-react"
import { FC } from "react"

import { SalesSaleWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/utils/date"

export interface SalesTableProps {
  sales: SalesSaleWithRelations[]
  isLoading?: boolean
  onViewDetails?: (sale: SalesSaleWithRelations) => void
  onEdit?: (sale: SalesSaleWithRelations) => void
  onDelete?: (sale: SalesSaleWithRelations) => void
  onCancel?: (sale: SalesSaleWithRelations) => void
}

const statusTokens: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completada",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
}

const paymentTokens: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  qr: "QR / Billetera",
}

export const SalesTable: FC<SalesTableProps> = ({ sales, isLoading, onViewDetails, onEdit, onDelete, onCancel }) => {
  if (isLoading) {
    return <TableSkeleton columns={6} rows={5} showActions={true} />
  }

  return (
    <TooltipProvider>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Venta</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Fecha</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Productos</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Importe</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-gray-400" />
                  </div>
                  <p>No hay ventas registradas</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              const token = statusTokens[sale.status] || statusTokens.completed
              const productsCount = sale.items.length
              const totalQuantity = sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
              const codesCount = sale.items.reduce((sum, item) => sum + (item.trackingCodes?.length ?? 0), 0)
              const paymentLabel = paymentTokens[sale.paymentMethod] || sale.paymentMethod

              return (
                <TableRow key={sale.id} className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                  <TableCell className="align-top py-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{sale.saleNumber}</span>
                      <span className="text-xs uppercase text-gray-500 dark:text-gray-400">{paymentLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {sale.customer
                        ? `${sale.customer.name ?? ''} ${sale.customer.lastName ?? ''}`.trim() || 'Cliente sin registrar'
                        : 'Cliente sin registrar'}
                    </div>
                    {sale.customer?.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sale.customer.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {sale.createdAt ? formatDateTime(sale.createdAt) : 'Sin fecha'}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <div className="text-sm text-gray-900 dark:text-white font-semibold">{productsCount} ítems</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{totalQuantity} unidades</div>
                    {codesCount > 0 && (
                      <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Badge variant="outline" className="rounded-full border-dashed">
                          {codesCount} códigos únicos
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      BOB {Number(sale.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    {Number(sale.discount || 0) > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Descuento: BOB {Number(sale.discount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <Badge
                      variant="outline"
                      className={`border ${token.className}`}
                    >
                      {token.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top py-5">
                    <div className="flex justify-end gap-2">
                      {onViewDetails && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(sale)}
                              className="hover:bg-gray-100 dark:hover:bg-gray-900/20 text-gray-600 dark:text-gray-400"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalles</TooltipContent>
                        </Tooltip>
                      )}
                      {onCancel && sale.status === 'completed' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCancel(sale)}
                              className="hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Anular venta</TooltipContent>
                        </Tooltip>
                      )}
                      {onEdit && sale.status !== 'cancelled' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(sale)}
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(sale)}
                              className="hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
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
    </TooltipProvider>
  )
}
