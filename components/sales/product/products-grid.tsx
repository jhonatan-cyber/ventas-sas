"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import { Package, Edit, Power, PowerOff, Trash2, Building2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { CardsGridSkeleton } from "@/components/ui/cards-grid-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProductsGridProps {
  products: (SalesProduct & { category: Category | null; branch: Branch | null })[]
  isLoading?: boolean
  showBranchColumn?: boolean
  onEdit?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onDelete?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onToggleStatus?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
}

function formatCurrency(value: number | string | { toNumber?: () => number }) {
  let numericValue = 0
  if (value && typeof value === 'object' && 'toNumber' in value && value.toNumber) {
    numericValue = value.toNumber()
  } else {
    numericValue = typeof value === "string" ? Number(value) : Number(value)
  }
  if (Number.isNaN(numericValue)) return "-"
  return `$${numericValue.toLocaleString()}`
}

function truncateText(text: string | null | undefined, maxLength = 120) {
  if (!text) return ""
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return `${truncated.slice(0, lastSpace > 60 ? lastSpace : maxLength).trimEnd()}...`
}

export function ProductsGrid({
  products,
  isLoading = false,
  showBranchColumn = false,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductsGridProps) {
  if (isLoading) {
    return <CardsGridSkeleton columns={3} />
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white/60 dark:bg-[#0f0f0f]/60">
        <CardHeader className="items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1f1f1f]">
            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <CardTitle className="text-lg">Sin productos</CardTitle>
          <CardDescription>No encontramos productos para los filtros seleccionados.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const isActive = product.isActive
          const isLowStock = product.stock <= product.minStock
          const description = product.description?.trim() ?? ""

          return (
            <Card
              key={product.id}
              className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] shadow-sm"
            >
              <CardHeader className="gap-4 pb-0">
                <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-[#2a2a2a]">
                  {product.imageUrl ? (
                     
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextElementSibling as HTMLElement | null
                        if (fallback) {
                          fallback.style.display = "flex"
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 hidden h-full w-full items-center justify-center"
                    style={{ display: product.imageUrl ? "none" : "flex" }}
                  >
                    <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight text-gray-900 dark:text-white">
                      {product.name}
                    </CardTitle>
                    {product.sku && (
                      <CardDescription className="text-xs font-medium uppercase tracking-wide">
                        SKU: {product.sku}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    className={
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                    }
                  >
                    {isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Marca</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.brand?.trim() || "-"}
                  </div>
                  <div className="text-muted-foreground">Modelo</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.model?.trim() || "-"}
                  </div>
                  <div className="text-muted-foreground">Precio venta</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="text-muted-foreground">Precio compra</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(product.cost)}
                  </div>
                  <div className="text-muted-foreground">Stock</div>
                  <div
                    className={`font-semibold ${
                      isLowStock
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {product.stock}
                    <span className="text-xs text-muted-foreground"> / mín. {product.minStock}</span>
                  </div>
                  {showBranchColumn && (
                    <>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        Sucursal
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {product.branch?.name || "-"}
                      </div>
                    </>
                  )}
                </div>

                {description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 cursor-help">
                        {truncateText(description)}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs whitespace-pre-wrap">
                      {description}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <p className="text-sm italic text-muted-foreground">Sin descripción</p>
                )}
              </CardContent>

              <CardFooter className="border-t border-dashed border-gray-200 pt-4 dark:border-[#2a2a2a]">
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>{product.category?.name || "Sin categoría"}</span>
                  </div>
                  <div className="flex flex-1 justify-end gap-2">
                    {onEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={() => onEdit(product)}
                            aria-label="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar producto</TooltipContent>
                      </Tooltip>
                    )}
                    {onToggleStatus && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={() => onToggleStatus(product)}
                            aria-label={isActive ? "Desactivar producto" : "Activar producto"}
                          >
                            {isActive ? (
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isActive ? "Desactivar producto" : "Activar producto"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full text-red-600 hover:text-red-600"
                            onClick={() => onDelete(product)}
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar producto</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

