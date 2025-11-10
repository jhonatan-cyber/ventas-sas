"use client";

import { DollarSign, X } from "lucide-react"

import { formatDate, formatCurrency } from "./invoices-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service"

interface InvoiceDetailDialogProps {
  invoice: SerializedInvoiceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment?: () => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    refunded:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  const labels: Record<string, string> = {
    paid: "Pagada",
    pending: "Pendiente",
    overdue: "Vencida",
    cancelled: "Cancelada",
    refunded: "Reembolsada",
  };

  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
};

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onAddPayment,
}: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const totalPaid = invoice.payments
    ? invoice.payments.reduce((sum, payment) => {
        if (payment.status === "completed") {
          return sum + Number(payment.amount);
        }
        return sum;
      }, 0)
    : 0;

  const remainingBalance = Number(invoice.total) - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  Factura #{invoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Detalles completos de la factura
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(invoice.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50/60 dark:bg-[#0c0c0c]">
          {/* Información de Facturación y Relacionada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2">
                Información de Facturación
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Nombre(s) y Apellido(s):
                  </span>
                  <p className="font-medium mt-0.5">{invoice.billingName}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Email:
                  </span>
                  <p className="font-medium mt-0.5">{invoice.billingEmail}</p>
                </div>
                {invoice.billingAddress && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Dirección:
                    </span>
                    <p className="font-medium mt-0.5">
                      {invoice.billingAddress}
                    </p>
                  </div>
                )}
                {invoice.billingTaxId && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      NIT / CUIT:
                    </span>
                    <p className="font-medium mt-0.5">{invoice.billingTaxId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información Relacionada */}
            {(invoice.organization ||
              invoice.subscription ||
              invoice.subscriptionPlan) && (
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2">
                  Información Relacionada
                </h3>
                <div className="space-y-2 text-sm">
                  {invoice.organization && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Organización:
                      </span>
                      <p className="font-medium mt-0.5">
                        {invoice.organization.name}
                      </p>
                    </div>
                  )}
                  {invoice.subscriptionPlan && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Plan:
                      </span>
                      <p className="font-medium mt-0.5">
                        {invoice.subscriptionPlan.name}
                      </p>
                    </div>
                  )}
                  {invoice.subscription && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Suscripción:
                      </span>
                      <p className="font-medium mt-0.5">
                        {invoice.subscription.billingPeriod === "monthly"
                          ? "Mensual | "
                          : "Anual | "}{" "}
                        {invoice.subscription.status === "active"
                          ? "Activo"
                          : invoice.subscription.status === "cancelled"
                          ? "Cancelada"
                          : invoice.subscription.status === "expired"
                          ? "Expirada"
                          : invoice.subscription.status === "trial"
                          ? "Prueba"
                          : invoice.subscription.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Montos y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2">Montos</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Subtotal:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                  </span>
                </div>
                {Number(invoice.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Impuesto:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(invoice.tax), invoice.currency)}
                    </span>
                  </div>
                )}
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Descuento:
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -
                      {formatCurrency(
                        Number(invoice.discount),
                        invoice.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t mt-1.5">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-base">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Pagado:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(totalPaid, invoice.currency)}
                      </span>
                    </div>
                    {remainingBalance > 0 && (
                      <div className="flex justify-between pt-1.5 border-t mt-1.5">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          Saldo Pendiente:
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(remainingBalance, invoice.currency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2">Fechas</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Fecha de Emisión:
                  </span>
                  <p className="font-medium mt-0.5">
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Fecha de Vencimiento:
                  </span>
                  <p className="font-medium mt-0.5">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.paidAt && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Fecha de Pago:
                    </span>
                    <p className="font-medium mt-0.5">
                      {formatDate(invoice.paidAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagos */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2">Pagos</h3>
              <div className="space-y-1.5">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {formatCurrency(
                            Number(payment.amount),
                            invoice.currency
                          )}
                        </span>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : payment.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {payment.paymentGateway} -{" "}
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción y Notas */}
          {(invoice.description || invoice.notes) && (
            <div className="border rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2">
                Información Adicional
              </h3>
              <div className="space-y-2 text-sm">
                {invoice.description && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Descripción:
                    </span>
                    <p className="mt-0.5">{invoice.description}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Notas:
                    </span>
                    <p className="mt-0.5">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          {onAddPayment &&
            invoice.status !== "paid" &&
            invoice.status !== "cancelled" && (
              <Button
                variant="default"
                size="sm"
                className="rounded-full"
                onClick={onAddPayment}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
