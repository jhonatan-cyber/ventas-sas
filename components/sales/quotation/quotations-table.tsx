"use client"

import { Edit, Trash2, FileText, Eye, ShoppingCart } from "lucide-react"

import type { FC } from "react"

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface QuotationsTableProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
  onEditClick?: (quotation: SalesQuotationWithRelations) => void
  onDeleteClick?: (quotation: SalesQuotationWithRelations) => void
  onViewDetails?: (quotation: SalesQuotationWithRelations) => void
  onConvertClick?: (quotation: SalesQuotationWithRelations) => void | Promise<void>
  showBranchColumn?: boolean
}

const statusTokens: Record<string, { label: string; className: string }> = {
  active: {
    label: "Activa",
    className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Vencida",
    className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  converted: {
    label: "Convertida",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  },
  approved: {
    label: "Aprobada",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rechazada",
    className: "bg-gray-200 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
}

export const QuotationsTable: FC<QuotationsTableProps> = ({ quotations, isLoading, onEditClick, onDeleteClick, onViewDetails, onConvertClick, showBranchColumn = false }) => {
  if (isLoading) {
    return <TableSkeleton columns={showBranchColumn ? 6 : 5} rows={5} showActions={true} />
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cotización</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
              {showBranchColumn && (
                <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>
              )}
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Productos</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Importes</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <p>No hay cotizaciones registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => {
                const totalItems = quotation.items?.length || 0
                const totalQuantity = quotation.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0
                const token = statusTokens[quotation.status] || statusTokens.pending
                const rawFullName = `${quotation.customer?.name ?? ""} ${quotation.customer?.lastName ?? ""}`.trim()
                const customerDisplayName = rawFullName || quotation.customerName || "Cliente sin registrar"
                const branchName = quotation.branch?.name || "Sin sucursal"
                const customerEmail = quotation.customer?.email || null
                const hasMissingProductIds = quotation.items?.some((item) => !item.productId)
                const isConverted = quotation.status === "converted"
                const convertTooltip = isConverted
                  ? "La cotización ya fue convertida"
                  : hasMissingProductIds
                    ? "Puedes asociar productos antes de convertir"
                    : "Convertir en venta"

                return (
                  <TableRow key={quotation.id} className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell className="align-top py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{quotation.quotationNumber}</span>
                        <span className="text-xs uppercase text-gray-500 dark:text-gray-400">Emitida el {formatDate(quotation.createdAt)}</span>
                        {quotation.expiresAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Vence: {formatDate(quotation.expiresAt)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 dark:text-white">{customerDisplayName}</span>
                        {customerEmail && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{customerEmail}</span>
                        )}
                      </div>
                    </TableCell>
                    {showBranchColumn && (
                      <TableCell className="align-top py-5">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{branchName}</span>
                      </TableCell>
                    )}
                    <TableCell className="align-top py-5">
                      <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <span>{totalItems} productos</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{totalQuantity} unidades</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-5">
                      <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">${Number(quotation.total).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</span>
                        {Number(quotation.discount) > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Desc: ${Number(quotation.discount).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">Subtotal: ${Number(quotation.subtotal).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-5">
                      <Badge className={`${token.className} rounded-full px-3 py-1 text-xs font-semibold`}>{token.label}</Badge>
                    </TableCell>
                    <TableCell className="align-top py-5">
                      <div className="flex justify-end gap-2">
                        {onConvertClick && !isConverted && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                onClick={() => onConvertClick(quotation)}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{convertTooltip}</TooltipContent>
                          </Tooltip>
                        )}

                        {onViewDetails && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-900/30 text-gray-600 dark:text-gray-300"
                                onClick={() => onViewDetails(quotation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalles</TooltipContent>
                          </Tooltip>
                        )}

                        {onEditClick && !isConverted && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                onClick={() => onEditClick(quotation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar cotización</TooltipContent>
                          </Tooltip>
                        )}

                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                onClick={() => onDeleteClick(quotation)}
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

