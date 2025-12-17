/**
 * Componente para gestionar ajustes de inventario
 */

"use client"

import { format } from "date-fns"
import { RefreshCw, Plus, ArrowUp, ArrowDown, Edit } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useSasPermissions } from "@/hooks/sales/use-sas-permissions"

interface InventoryAdjustment {
  id: string
  product: {
    id: string
    name: string
  }
  branch?: {
    id: string
    name: string
  } | null
  adjustmentType: "INCREASE" | "DECREASE" | "CORRECTION"
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  justification: string
  notes?: string | null
  user: {
    id: string
    fullName: string
  }
  createdAt: string
}

interface InventoryAdjustmentsProps {
  customerSlug: string
}

const REASON_SUGGESTIONS = [
  "loss",
  "damage",
  "expiration",
  "theft",
  "countingError",
  "return",
  "correction",
  "other",
];

export function InventoryAdjustments({ customerSlug }: InventoryAdjustmentsProps) {
  // Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions()

  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [pageSize, setPageSize] = useState(20)

  // Estados para crear ajuste
  const [productId, setProductId] = useState("")
  const [branchId, setBranchId] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"INCREASE" | "DECREASE" | "CORRECTION">("INCREASE")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [justification, setJustification] = useState("")
  const [notes, setNotes] = useState("")
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])

  const loadAdjustments = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (branchId) params.append("branchId", branchId)

      const response = await fetch(`/api/${customerSlug}/inventory/adjustments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAdjustments(data.adjustments || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error cargando ajustes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, page, pageSize, branchId])

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`)
      const data = await response.json()
      if (data.branches) {
        setBranches(
          data.branches
            .filter((b: any) => b.id && String(b.id).trim() !== '')
            .map((b: any) => ({ id: b.id, name: b.name }))
        )
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error)
    }
  }, [customerSlug])

  useEffect(() => {
    loadAdjustments()
    loadBranches()
  }, [loadAdjustments, loadBranches])

  const loadProducts = async (branchId?: string) => {
    try {
      const url = branchId
        ? `/api/${customerSlug}/productos?branchId=${branchId}&page=1&pageSize=1000`
        : `/api/${customerSlug}/productos?page=1&pageSize=1000`
      const response = await fetch(url)
      const data = await response.json()
      if (data.products) {
        setProducts(
          data.products
            .filter((p: any) => p.id && String(p.id).trim() !== '')
            .map((p: any) => ({ id: p.id, name: p.name }))
        )
      }
    } catch (error) {
      console.error("Error cargando productos:", error)
    }
  }

  const handleCreateAdjustment = async () => {
    if (!productId || !adjustmentType || !quantity || !reason || !justification) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (adjustmentType !== "CORRECTION" && parseInt(quantity) <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    try {
      const response = await fetch(`/api/${customerSlug}/inventory/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          branchId: branchId || undefined,
          adjustmentType,
          quantity: adjustmentType === "CORRECTION" ? parseInt(quantity) : parseInt(quantity),
          reason,
          justification,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = data.error || data.message || 'Error al crear ajuste'
        toast.error(errorMessage)
        return
      }

      toast.success('Ajuste creado')
      setIsCreateDialogOpen(false)
      setProductId("")
      setBranchId("")
      setAdjustmentType("INCREASE")
      setQuantity("")
      setReason("")
      setJustification("")
      setNotes("")
      loadAdjustments()
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear ajuste'
      toast.error(errorMessage)
    }
  }

  const getAdjustmentTypeIcon = (type: string) => {
    switch (type) {
      case "INCREASE":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "DECREASE":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case "CORRECTION":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <Edit className="h-4 w-4 text-gray-500" />
    }
  }

  const getAdjustmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INCREASE: 'Aumento',
      DECREASE: 'Disminución',
      CORRECTION: 'Corrección',
    }
    return labels[type] || type
  }

  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case "INCREASE":
        return "default"
      case "DECREASE":
        return "destructive"
      case "CORRECTION":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                'Ajustes de Inventario'
              </CardTitle>
              <CardDescription>
                'Ajusta el stock de productos con justificación'
              </CardDescription>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-300">
                  {"Datos"}
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {"por página"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasPermission('inventario_crear') && (
                <Button
                  onClick={() => {
                    setIsCreateDialogOpen(true)
                    loadProducts()
                  }}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Ajuste
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : adjustments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              'No hay ajustes registrados'
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>'Producto'</TableHead>
                      <TableHead>'Tipo'</TableHead>
                      <TableHead>'Cantidad'</TableHead>
                      <TableHead>'Stock'</TableHead>
                      <TableHead>'Razón'</TableHead>
                      <TableHead>'Usuario'</TableHead>
                      <TableHead>'Fecha'</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => {
                      const typeBadge = getAdjustmentTypeBadge(adjustment.adjustmentType)
                      return (
                        <TableRow key={adjustment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adjustment.product.name}</div>
                              {adjustment.branch && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {adjustment.branch.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeBadge}>
                              <div className="flex items-center gap-1">
                                {getAdjustmentTypeIcon(adjustment.adjustmentType)}
                                {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={adjustment.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                              {adjustment.quantity > 0 ? "+" : ""}{adjustment.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-gray-500">{adjustment.previousStock}</span>
                              <span className="mx-1">→</span>
                              <span className="font-medium">{adjustment.newStock}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">
                              <div className="font-medium">{adjustment.reason}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {adjustment.justification}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{adjustment.user.fullName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(adjustment.createdAt), "dd/MM/yyyy HH:mm")}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {(() => {
                const totalPages = Math.ceil(total / pageSize)
                return totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-full"
                    >
                      {"Anterior"}
                    </Button>
                    <div className="text-sm text-gray-500 dark:text-gray-400 px-2">
                      Página {page} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-full"
                    >
                      {"Siguiente"}
                    </Button>
                  </div>
                )
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear ajuste */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-2xl">
          {/* Header estático */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
            <DialogHeader className="px-0 py-0 space-y-2">
              <DialogTitle>Nuevo Ajuste</DialogTitle>
              <DialogDescription>
                'Crea un nuevo ajuste de inventario con justificación'
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
              {/* Fila 1: Sucursal y Producto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    'Sucursal (Opcional)'
                  </Label>
                  <Select value={branchId || '__all__'} onValueChange={(value) => {
                    const actualValue = value === '__all__' ? '' : value
                    setBranchId(actualValue)
                    loadProducts(actualValue || undefined)
                  }}>
                    <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                      <SelectValue placeholder='Todas las sucursales' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">'Todas las sucursales'</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    'Producto' *
                  </Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                      <SelectValue placeholder='Seleccionar producto' />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 2: Tipo, Cantidad y Razón */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    'Tipo' *
                  </Label>
                  <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as any)}>
                    <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCREASE">'Aumento'</SelectItem>
                      <SelectItem value="DECREASE">'Disminución'</SelectItem>
                      <SelectItem value="CORRECTION">'Corrección'</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    'Cantidad' *
                    {adjustmentType === "CORRECTION" && (
                      <span className="text-xs text-gray-500 ml-1 block">('Stock final')</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={adjustmentType === "CORRECTION" ? "0" : "1"}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    'Razón' *
                  </Label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder='Pérdida, daño...'
                    className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  />
                </div>
              </div>

              {/* Etiquetas de sugerencias de razón - Ocupan todo el ancho */}
              <div className="w-full">
                <div className="flex flex-wrap gap-2">
                  {REASON_SUGGESTIONS.map((suggestion) => {
                    // Mapear las claves a los valores originales para comparación
                    const originalValues: Record<string, string> = {
                      loss: "Pérdida",
                      damage: "Daño",
                      expiration: "Vencimiento",
                      theft: "Robo",
                      countingError: "Error de conteo",
                      return: "Devolución",
                      correction: "Corrección",
                      other: "Otros",
                    };
                    const originalValue = originalValues[suggestion] || suggestion;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${reason === originalValue
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        onClick={() => setReason(originalValue)}
                      >
                        originalValue
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Justificación */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  'Justificación' *
                </Label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder='Explica el motivo del ajuste...'
                  className="rounded-2xl bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  rows={3}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {'Notas'} ({'Opcional'})
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={'Notas opcionales...'}
                  className="rounded-2xl bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer estático */}
            <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-full"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                'Cancelar'
              </Button>
              <Button
                type="button"
                onClick={handleCreateAdjustment}
                className="w-full sm:w-auto rounded-full"
              >
                {'Crear'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

