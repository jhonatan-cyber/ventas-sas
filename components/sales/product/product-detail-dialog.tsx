"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import {

    DollarSign,
    ShoppingCart,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
    Tag,
    FileText,
} from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences"
import { formatDateTime } from "@/lib/utils/date"

type ProductWithRelations = SalesProduct & {
    category: Category | null
    branch: Branch | null
}

interface ProductDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: ProductWithRelations | null | undefined
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

export function ProductDetailDialog({
    open,
    onOpenChange,
    product,
}: ProductDetailDialogProps) {
    if (!product) return null

    const formatDate = (date: Date | string | null) => {
        if (!date) return "N/A"
        // Usar formatDateTime para mostrar fecha y hora completas
        return formatDateTime(date)
    }

    const price = typeof product.price === 'object' && 'toNumber' in product.price ? product.price.toNumber() : Number(product.price)
    const cost = typeof product.cost === 'object' && 'toNumber' in product.cost ? product.cost.toNumber() : Number(product.cost)
    const isLowStock = product.stock <= product.minStock
    const profit = price - cost
    const profitMargin = cost > 0 ? ((profit / cost) * 100).toFixed(2) : "0.00"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] lg:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
                {/* Header estático */}
                <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
                    <DialogHeader className="px-0 py-0 space-y-2">
                        <DialogTitle className="flex items-center gap-3">

                            <div className="flex-1 text-center">

                                <DialogDescription className="mt-1">
                                    Información detallada del producto
                                </DialogDescription>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                    {/* Contenido con scroll */}
                    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
                        {/* Imagen del producto */}
                        {product.imageUrl && (
                            <div className="flex justify-center">
                                <div className="relative w-full max-w-md h-64 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            </div>
                        )}

                        {/* Información General */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Información General
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Nombre del Producto</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            product.isActive
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                                : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                                        }
                                    >
                                        {product.isActive ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Activo
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactivo
                                            </>
                                        )}
                                    </Badge>
                                </div>
                                {product.description && (
                                    <div className="space-y-1 md:col-span-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {product.description}
                                        </p>
                                    </div>
                                )}
                                {product.brand && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Marca</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {product.brand}
                                        </p>
                                    </div>
                                )}
                                {product.model && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Modelo</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {product.model}
                                        </p>
                                    </div>
                                )}
                                {product.category && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Categoría</p>
                                        <Badge variant="outline" className="text-xs">
                                            {product.category.name}
                                        </Badge>
                                    </div>
                                )}
                                {product.branch && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
                                        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800">
                                            {product.branch.name}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Información de Códigos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Códigos de Identificación
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.sku && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                                            {product.sku}
                                        </p>
                                    </div>
                                )}
                                {product.barcode && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Código de Barras</p>
                                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                                            {product.barcode}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Información Financiera */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Información Financiera
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Precio de Compra</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(cost)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Precio de Venta</p>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(price)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ganancia</p>
                                    <p className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(profit)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Margen de Ganancia</p>
                                    <p className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {profitMargin}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Información de Inventario */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Información de Inventario
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock Actual</p>
                                    <div className="flex items-center gap-2">
                                        {isLowStock && (
                                            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                                        )}
                                        <p className={`text-sm font-semibold ${isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                                            {product.stock} unidades
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock Mínimo</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {product.minStock} unidades
                                    </p>
                                </div>
                                {isLowStock && (
                                    <div className="space-y-1 md:col-span-2">
                                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Stock bajo: El stock actual está en o por debajo del mínimo
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Información del Sistema */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Información del Sistema
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Creación</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {formatDate(product.createdAt)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Última Actualización</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {formatDate(product.updatedAt)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID del Producto</p>
                                    <p className="text-sm font-mono text-gray-600 dark:text-gray-400 text-xs break-all">
                                        {product.id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer estático */}
                <div className="flex justify-center border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

