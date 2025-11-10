"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service"

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: SerializedInvoiceWithRelations | null
  onSave: () => void
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoice,
  onSave,
}: PaymentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethodType: "efectivo",
  })

  useEffect(() => {
    if (open && invoice) {
      setFormData({
        amount: invoice.total.toString(),
        paymentMethodType: "efectivo",
      })
    }
  }, [open, invoice])

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
          paymentGateway: "manual",
          paymentMethodType: formData.paymentMethodType,
        }),
      })

      const data = await response.json()

      if (data.success || data.payment) {
        toast.success("Pago registrado exitosamente")
        onSave()
        // Cerrar el modal después de un breve delay para permitir que se actualicen los datos
        setTimeout(() => {
          onOpenChange(false)
        }, 300)
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registrar un pago para la factura #{invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
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

            <div className="space-y-2">
              <Label htmlFor="paymentMethodType">
                Método de Pago <span className="text-red-500">*</span>
              </Label>
              <select
                id="paymentMethodType"
                value={formData.paymentMethodType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethodType: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={isSubmitting}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="billetera_movil">Billetera Móvil</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full px-6"
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
