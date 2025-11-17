"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import { Package, Edit, Trash2, Power, PowerOff, MoreVertical, Building2, AlertTriangle, Eye } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface ProductsCardsProps {
  products: (SalesProduct & { category: Category | null; branch: Branch | null })[]
  showBranchColumn?: boolean
  onEdit?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onToggleStatus?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onDelete?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onView?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
}

function formatCurrency(value: number | string | { toNumber?: () => number }) {
  let numericValue = 0
  if (value && typeof value === 'object' && 'toNumber' in value && value.toNumber) {
    numericValue = value.toNumber()
  } else {
    numericValue = typeof value === "string" ? Number(value) : Number(value)
  }
  if (Number.isNaN(numericValue)) return "-"
  return formatCurrencyWithPreferences(numericValue)
}

export function ProductsCards({ products, showBranchColumn = false, onEdit, onToggleStatus, onDelete, onView }: ProductsCardsProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      {products.map((product) => {
        const isLowStock = product.stock <= product.minStock
        const price = typeof product.price === 'object' && 'toNumber' in product.price ? product.price.toNumber() : Number(product.price)

        return (
          <Card key={product.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Header con foto, nombre, badge y menú de acciones */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Foto del producto o icono por defecto */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {product.name}
                        </span>
                        <Badge
                          className={
                            product.isActive
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0 shrink-0'
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0 shrink-0'
                          }
                        >
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <MoreVertical className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onView && (
                        <>
                          <DropdownMenuItem onClick={() => onView(product)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                            <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(product)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                          <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(product)}
                            className={`cursor-pointer ${
                              product.isActive
                                ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                                : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                            }`}
                          >
                            {product.isActive
                              ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                              : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                            }
                            <span className={product.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                              {product.isActive ? 'Desactivar' : 'Activar'}
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(product)}
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

                {/* Información detallada */}
                <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Precio</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Stock</span>
                    <div className="flex items-center gap-1">
                      {isLowStock && (
                        <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />
                      )}
                      <span className={`text-xs font-semibold ${isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                  {product.category && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Cat:</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {product.category.name}
                      </Badge>
                    </div>
                  )}
                  {showBranchColumn && product.branch && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                        {product.branch.name}
                      </span>
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

