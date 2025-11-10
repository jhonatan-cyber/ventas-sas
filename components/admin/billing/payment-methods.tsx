"use client"

import { CreditCard, Plus, Loader2, AlertCircle, Trash2, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface PaymentMethod {
  id: string
  type: string
  provider: string
  label: string
  last4: string | null
  brand: string | null
  expiryMonth: number | null
  expiryYear: number | null
  isDefault: boolean
  isActive: boolean
  organizationId: string | null
  createdAt: Date
}

export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    organizationId: "",
    type: "card",
    provider: "manual",
    label: "",
    last4: "",
    brand: "",
    expiryMonth: "",
    expiryYear: "",
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/administracion/billing/payment-methods")
      const data = await response.json()

      if (data.success) {
        setPaymentMethods(data.paymentMethods || [])
      } else {
        toast.error("Error al cargar métodos de pago")
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast.error("Error al cargar métodos de pago")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/administracion/billing/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: formData.organizationId || undefined,
          type: formData.type,
          provider: formData.provider,
          label: formData.label,
          last4: formData.last4 || undefined,
          brand: formData.brand || undefined,
          expiryMonth: formData.expiryMonth ? parseInt(formData.expiryMonth) : undefined,
          expiryYear: formData.expiryYear ? parseInt(formData.expiryYear) : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Método de pago creado exitosamente")
        setIsDialogOpen(false)
        setFormData({
          organizationId: "",
          type: "card",
          provider: "manual",
          label: "",
          last4: "",
          brand: "",
          expiryMonth: "",
          expiryYear: "",
        })
        fetchPaymentMethods()
      } else {
        toast.error(data.error || "Error al crear método de pago")
      }
    } catch (error) {
      console.error("Error creating payment method:", error)
      toast.error("Error al crear método de pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/administracion/billing/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-default" }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Método de pago establecido como predeterminado")
        fetchPaymentMethods()
      } else {
        toast.error(data.error || "Error al establecer como predeterminado")
      }
    } catch (error) {
      console.error("Error setting default:", error)
      toast.error("Error al establecer como predeterminado")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este método de pago?")) {
      return
    }

    try {
      const response = await fetch(`/api/administracion/billing/payment-methods/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Método de pago eliminado exitosamente")
        fetchPaymentMethods()
      } else {
        toast.error(data.error || "Error al eliminar método de pago")
      }
    } catch (error) {
      console.error("Error deleting payment method:", error)
      toast.error("Error al eliminar método de pago")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>
                Gestiona los métodos de pago disponibles para las organizaciones
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Método
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay métodos de pago configurados. Los métodos de pago se configuran por organización.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.label}</span>
                        {method.isDefault && (
                          <Badge variant="default">Por Defecto</Badge>
                        )}
                        <Badge variant="outline">{method.provider}</Badge>
                        <Badge variant="secondary">{method.type}</Badge>
                      </div>
                      {method.last4 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          •••• {method.last4}
                          {method.brand && ` - ${method.brand}`}
                          {method.expiryMonth && method.expiryYear && ` (${method.expiryMonth}/${method.expiryYear})`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Creado: {new Date(method.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar método de pago */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
            <DialogDescription>
              Completa los datos para agregar un nuevo método de pago
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">
                  Alias / Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ej: Tarjeta Principal"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="bank_account">Cuenta Bancaria</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Proveedor <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "card" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="last4">Últimos 4 dígitos</Label>
                      <Input
                        id="last4"
                        value={formData.last4}
                        onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
                        placeholder="1234"
                        maxLength={4}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Select
                        value={formData.brand}
                        onValueChange={(value) => setFormData({ ...formData, brand: value })}
                      >
                        <SelectTrigger id="brand">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                          <SelectItem value="discover">Discover</SelectItem>
                          <SelectItem value="other">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryMonth">Mes de expiración</Label>
                      <Input
                        id="expiryMonth"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.expiryMonth}
                        onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                        placeholder="MM"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryYear">Año de expiración</Label>
                      <Input
                        id="expiryYear"
                        type="number"
                        min={new Date().getFullYear()}
                        value={formData.expiryYear}
                        onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                        placeholder="YYYY"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="organizationId">ID de Organización (opcional)</Label>
                <Input
                  id="organizationId"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  placeholder="UUID de la organización"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.label}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
