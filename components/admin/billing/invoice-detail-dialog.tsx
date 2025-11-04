"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvoiceWithRelations } from "@/lib/services/admin/billing-service"
import { Mail, FileText, Download, X, DollarSign } from "lucide-react"
import { formatDate, formatCurrency } from "./invoices-table"

interface InvoiceDetailDialogProps {
  invoice: InvoiceWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddPayment?: () => void
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  }

  const labels: Record<string, string> = {
    paid: "Pagada",
    pending: "Pendiente",
    overdue: "Vencida",
    cancelled: "Cancelada",
    refunded: "Reembolsada",
  }

  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  )
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onAddPayment,
}: InvoiceDetailDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Factura #{invoice.invoiceNumber}</DialogTitle>
              <DialogDescription className="mt-1">
                Detalles completos de la factura
              </DialogDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de Facturación */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Información de Facturación</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Nombre / Razón Social:</span>
                <p className="font-medium mt-1">{invoice.billingName}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <p className="font-medium mt-1">{invoice.billingEmail}</p>
              </div>
              {invoice.billingAddress && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Dirección:</span>
                  <p className="font-medium mt-1">{invoice.billingAddress}</p>
                </div>
              )}
              {invoice.billingTaxId && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">NIT / CUIT:</span>
                  <p className="font-medium mt-1">{invoice.billingTaxId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información Relacionada */}
          {(invoice.organization || invoice.subscription || invoice.subscriptionPlan) && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Información Relacionada</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {invoice.organization && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Organización:</span>
                    <p className="font-medium mt-1">{invoice.organization.name}</p>
                  </div>
                )}
                {invoice.subscriptionPlan && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Plan:</span>
                    <p className="font-medium mt-1">{invoice.subscriptionPlan.name}</p>
                  </div>
                )}
                {invoice.subscription && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Suscripción:</span>
                    <p className="font-medium mt-1">
                      {invoice.subscription.status} ({invoice.subscription.billingPeriod})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Montos */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Montos</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                </span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Impuesto:</span>
                  <span className="font-medium">
                    {formatCurrency(Number(invoice.tax), invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Descuento:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(Number(invoice.discount), invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(Number(invoice.total), invoice.currency)}
                </span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500 dark:text-gray-400">Pagado:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(totalPaid, invoice.currency)}
                    </span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500 dark:text-gray-400">Saldo Pendiente:</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(remainingBalance, invoice.currency)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Fechas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Fecha de Emisión:</span>
                <p className="font-medium mt-1">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Fecha de Vencimiento:</span>
                <p className="font-medium mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              {invoice.paidAt && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fecha de Pago:</span>
                  <p className="font-medium mt-1">{formatDate(invoice.paidAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagos */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Pagos</h3>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </span>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : payment.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {payment.paymentGateway} - {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción y Notas */}
          {(invoice.description || invoice.notes) && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Información Adicional</h3>
              {invoice.description && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Descripción:</span>
                  <p className="mt-1">{invoice.description}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Notas:</span>
                  <p className="mt-1">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-4 border-t">
            {onAddPayment && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button variant="default" size="sm" onClick={onAddPayment}>
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
            {invoice.paymentLink && (
              <Button variant="outline" size="sm" onClick={() => window.open(invoice.paymentLink!)}>
                <FileText className="h-4 w-4 mr-2" />
                Link de Pago
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
