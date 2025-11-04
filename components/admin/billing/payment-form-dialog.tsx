"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { InvoiceWithRelations } from "@/lib/services/admin/billing-service"

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceWithRelations | null
  onSave: () => void
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoice,
  onSave,
}: PaymentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethodId: "",
    paymentGateway: "manual",
    paymentMethodType: "card",
    last4: "",
    brand: "",
  })

  useEffect(() => {
    if (open && invoice) {
      setFormData({
        amount: invoice.total.toString(),
        paymentMethodId: "",
        paymentGateway: "manual",
        paymentMethodType: "card",
        last4: "",
        brand: "",
      })

      // Cargar métodos de pago si hay organización
      if (invoice.organizationId) {
        fetchPaymentMethods(invoice.organizationId)
      }
    }
  }, [open, invoice])

  const fetchPaymentMethods = async (organizationId: string) => {
    try {
      const response = await fetch(
        `/api/administracion/billing/payment-methods?organizationId=${organizationId}`
      )
      const data = await response.json()
      if (data.success) {
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/administracion/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: parseFloat(formData.amount),
          paymentMethodId: formData.paymentMethodId || undefined,
          paymentGateway: formData.paymentGateway,
          paymentMethodType: formData.paymentMethodType || undefined,
          last4: formData.last4 || undefined,
          brand: formData.brand || undefined,
        }),
      })

      const data = await response.json()

      if (data.success || data.payment) {
        toast.success("Pago registrado exitosamente")
        onOpenChange(false)
        onSave()
      } else {
        toast.error(data.error || "Error al registrar pago")
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast.error("Error al registrar pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!invoice) return null

  const totalPaid = invoice.payments
    ? invoice.payments.reduce((sum, payment) => {
        if (payment.status === "completed") {
          return sum + Number(payment.amount)
        }
        return sum
      }, 0)
    : 0

  const remainingBalance = Number(invoice.total) - totalPaid
  const maxAmount = remainingBalance > 0 ? remainingBalance : Number(invoice.total)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registrar un pago para la factura #{invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Total de la Factura
              </div>
              <div className="text-lg font-bold">
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: invoice.currency,
                }).format(Number(invoice.total))}
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Pagado:{" "}
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(totalPaid)}
                  </div>
                  <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Saldo Pendiente:{" "}
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(remainingBalance)}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Monto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Máximo:{" "}
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: invoice.currency,
                }).format(maxAmount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentGateway">
                  Gateway de Pago <span className="text-red-500">*</span>
                </Label>
                <select
                  id="paymentGateway"
                  value={formData.paymentGateway}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentGateway: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={isSubmitting}
                >
                  <option value="manual">Manual</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="mercado_pago">Mercado Pago</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethodType">Tipo de Método</Label>
                <select
                  id="paymentMethodType"
                  value={formData.paymentMethodType}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethodType: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="card">Tarjeta</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                  <option value="cash">Efectivo</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            {paymentMethods.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="paymentMethodId">Método de Pago Guardado (opcional)</Label>
                <select
                  id="paymentMethodId"
                  value={formData.paymentMethodId}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethodId: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Seleccionar método guardado...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                      {method.last4 && ` (****${method.last4})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.paymentMethodType === "card" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last4">Últimos 4 dígitos</Label>
                  <Input
                    id="last4"
                    value={formData.last4}
                    onChange={(e) =>
                      setFormData({ ...formData, last4: e.target.value })
                    }
                    placeholder="1234"
                    maxLength={4}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <select
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="discover">Discover</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.amount ||
                parseFloat(formData.amount) <= 0 ||
                parseFloat(formData.amount) > maxAmount
              }
            >
              {isSubmitting ? "Registrando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
