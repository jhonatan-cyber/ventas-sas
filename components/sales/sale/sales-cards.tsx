"use client"

import { SalesSaleWithRelations } from "./types"
import { Receipt, Edit, Trash2, Ban, MoreVertical, DollarSign, CalendarDays, User, ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences"

interface SalesCardsProps {
  sales: SalesSaleWithRelations[]
  onEdit?: (sale: SalesSaleWithRelations) => void
  onDelete?: (sale: SalesSaleWithRelations) => void
  onViewDetails?: (sale: SalesSaleWithRelations) => void
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

export function SalesCards({ sales, onEdit, onDelete, onViewDetails, onCancel }: SalesCardsProps) {
  if (sales.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {sales.map((sale) => {
        const token = statusTokens[sale.status] || statusTokens.completed
        const productsCount = sale.items.length
        const totalQuantity = sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        const codesCount = sale.items.reduce((sum, item) => sum + (item.trackingCodes?.length ?? 0), 0)
        const paymentLabel = paymentTokens[sale.paymentMethod] || sale.paymentMethod
        const customerName = sale.customer
          ? `${sale.customer.name ?? ''} ${sale.customer.lastName ?? ''}`.trim() || sale.customerName || 'Cliente sin registrar'
          : sale.customerName || 'Cliente sin registrar'

        return (
          <Card key={sale.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header con número de venta, estado y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {sale.saleNumber}
                      </span>
                      <Badge className={`${token.className} rounded-full px-2 py-0.5 text-xs font-semibold shrink-0`}>
                        {token.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                        {formatCurrencyWithPreferences(Number(sale.total || 0))}
                      </span>
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
                      {onViewDetails && (
                        <>
                          <DropdownMenuItem onClick={() => onViewDetails(sale)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                            <Receipt className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onCancel && sale.status === 'completed' && (
                        <>
                          <DropdownMenuItem onClick={() => onCancel(sale)} className="cursor-pointer text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400">
                            <Ban className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                            <span className="text-orange-600 dark:text-orange-400">Anular</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onEdit && sale.status !== 'cancelled' && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(sale)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                            <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(sale)}
                          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400">Eliminar</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información del cliente */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400 truncate">{customerName}</span>
                </div>

                {/* Información de productos */}
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {productsCount} ítems • {totalQuantity} unidades
                  </span>
                  {codesCount > 0 && (
                    <Badge variant="outline" className="rounded-full border-dashed text-xs ml-auto">
                      {codesCount} códigos
                    </Badge>
                  )}
                </div>

                {/* Fecha y método de pago */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {sale.createdAt ? formatDateWithPreferences(sale.createdAt) : 'Sin fecha'}
                  </div>
                  <span className="uppercase">{paymentLabel}</span>
                </div>

                {/* Descuento si existe */}
                {Number(sale.discount || 0) > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Descuento: {formatCurrencyWithPreferences(Number(sale.discount || 0))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

