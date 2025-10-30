"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SalesProduct, Category } from "@prisma/client"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: SalesProduct & { category: Category | null }
  categories: Category[]
  onSave: (data: any) => void
}

export function ProductFormDialog({ open, onOpenChange, product, categories, onSave }: ProductFormDialogProps) {
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("")
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setName(product.name || "")
      setCategoryId(product.categoryId || "")
      setDescription(product.description || "")
      setPrice(Number(product.price).toString())
      setCost(Number(product.cost).toString())
      setStock(product.stock?.toString() || "0")
      setMinStock(product.minStock?.toString() || "0")
      setSku(product.sku || "")
      setBarcode(product.barcode || "")
    } else {
      setName("")
      setCategoryId("")
      setDescription("")
      setPrice("")
      setCost("")
      setStock("0")
      setMinStock("0")
      setSku("")
      setBarcode("")
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !price || !cost) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        categoryId: categoryId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        cost: Number(cost),
        stock: stock ? Number(stock) : 0,
        minStock: minStock ? Number(minStock) : 0,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? "Modifica los datos del producto" 
              : "Completa los datos para crear un nuevo producto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del producto"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo <span className="text-red-500">*</span></Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Inicial</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Código SKU"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Código de barras"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !name.trim() || !price || !cost}
            >
              {isLoading ? "Guardando..." : product ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

