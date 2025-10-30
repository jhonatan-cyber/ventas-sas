"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Quotation, SalesCustomer, SalesProduct } from "@prisma/client"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface QuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation?: Quotation & { items?: any[]; customer?: any }
  organizationId: string
  onSave: (data: any) => void
}

export function QuotationFormDialog({ open, onOpenChange, quotation, organizationId, onSave }: QuotationFormDialogProps) {
  const [customerId, setCustomerId] = useState("")
  const [customers, setCustomers] = useState<SalesCustomer[]>([])
  const [products, setProducts] = useState<SalesProduct[]>([])
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; subtotal: number }>>([])
  const [discount, setDiscount] = useState(0)
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Cargar clientes y productos
  useEffect(() => {
    if (open) {
      loadCustomers()
      loadProducts()
    }
  }, [open, organizationId])

  // Cargar datos de la cotización si existe
  useEffect(() => {
    if (quotation && open) {
      setCustomerId(quotation.customerId || "")
      setDiscount(Number(quotation.discount) || 0)
      setExpiresAt(quotation.expiresAt ? new Date(quotation.expiresAt).toISOString().split('T')[0] : "")
      setNotes(quotation.notes || "")
      if (quotation.items) {
        setItems(quotation.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal)
        })))
      }
    } else if (!quotation && open) {
      setCustomerId("")
      setDiscount(0)
      setExpiresAt("")
      setNotes("")
      setItems([])
    }
  }, [quotation, open])

  const loadCustomers = async () => {
    try {
      setIsLoadingData(true)
      // El organizationId aquí es realmente el slug del customer
      const response = await fetch(`/api/${organizationId}/clientes`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadProducts = async () => {
    try {
      setIsLoadingData(true)
      // El organizationId aquí es realmente el slug del customer
      const response = await fetch(`/api/${organizationId}/productos`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0, subtotal: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Si se actualiza producto, cantidad o precio, recalcular subtotal
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].unitPrice = Number(product.price)
        newItems[index].subtotal = newItems[index].quantity * Number(product.price)
      }
    } else if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const total = subtotal - discount
    return { subtotal, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId) {
      toast.error("Debe seleccionar un cliente")
      return
    }

    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto")
      return
    }

    const { subtotal, total } = calculateTotals()

    setIsLoading(true)
    try {
      await onSave({
        customerId,
        subtotal,
        discount,
        total,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        notes,
        items
      })
    } finally {
      setIsLoading(false)
    }
  }

  const { subtotal, total } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotation ? "Editar Cotización" : "Nueva Cotización"}
          </DialogTitle>
          <DialogDescription>
            {quotation 
              ? "Modifica los datos de la cotización" 
              : "Completa los datos para crear una nueva cotización"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente <span className="text-red-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={isLoading || isLoadingData}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Productos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Producto
                </Button>
              </div>
              
              <div className="space-y-2 border rounded-md p-4">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay productos agregados</p>
                ) : (
                  items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 border rounded bg-gray-50 dark:bg-[#2a2a2a]">
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, 'productId', value)}
                        disabled={isLoading || isLoadingData}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ${Number(product.price).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="1"
                        disabled={isLoading}
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24"
                        step="0.01"
                        disabled={isLoading}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium">${item.subtotal.toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="discount" className="w-32">Descuento:</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Fecha de expiración */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Fecha de Expiración</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                disabled={isLoading}
                rows={3}
              />
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
              disabled={isLoading || !customerId || items.length === 0}
            >
              {isLoading ? "Guardando..." : quotation ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

