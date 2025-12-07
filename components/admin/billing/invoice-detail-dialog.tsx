"use client";

import { X } from "lucide-react";

import { formatDate } from "./invoices-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service";

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

  // Función para formatear montos sin símbolo de dólar, usando "Bs" al final
  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    // Formatear número sin símbolo de moneda (solo número con separadores)
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount)
    // Por ahora siempre mostrar "Bs" al final (se configurará desde módulo de configuración)
    return `${formatted} Bs`
  }

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

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white dark:bg-[#0c0c0c]">
          {/* Información de Facturación */}
          <div>
            <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
              Información de Facturación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Nombre(s) y Apellido(s)
                </span>
                <span className="font-medium">
                  {(() => {
                    if (invoice.organization?.owner) {
                      return invoice.organization.owner.fullName || invoice.organization.owner.email
                    }
                    const customer = invoice.organization?.customerOrganizations?.[0]?.customer
                    if (customer) {
                      const customerName = `${(customer as any).nombre || ''} ${(customer as any).apellido || ''}`.trim()
                      if (customerName) {
                        return customerName
                      }
                    }
                    return invoice.billingName
                  })()}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Email
                </span>
                <span className="font-medium">{invoice.billingEmail}</span>
              </div>
              
              {invoice.billingAddress && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Dirección
                  </span>
                  <span className="font-medium">{invoice.billingAddress}</span>
                </div>
              )}
              
              {invoice.billingTaxId && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    NIT / CUIT
                  </span>
                  <span className="font-medium">{invoice.billingTaxId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información Relacionada */}
          {(invoice.organization || invoice.subscription || invoice.subscriptionPlan) && (
            <div>
              <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                Información Relacionada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {invoice.organization && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Organización
                    </span>
                    <span className="font-medium">{invoice.organization.name}</span>
                  </div>
                )}
                
                {invoice.subscriptionPlan && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Plan
                    </span>
                    <span className="font-medium">{invoice.subscriptionPlan.name}</span>
                  </div>
                )}
                
                {invoice.subscription && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Suscripción
                    </span>
                    <span className="font-medium">
                      {invoice.subscription.billingPeriod === "monthly" ? "Mensual" : "Anual"} | {" "}
                      {invoice.subscription.status === "active"
                        ? "Activo"
                        : invoice.subscription.status === "cancelled"
                        ? "Cancelada"
                        : invoice.subscription.status === "expired"
                        ? "Expirada"
                        : invoice.subscription.status === "trial"
                        ? "Prueba"
                        : invoice.subscription.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div>
            <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
              Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Fecha de Emisión
                </span>
                <span className="font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Fecha de Vencimiento
                </span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              
              {invoice.paidAt && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Fecha de Pago
                  </span>
                  <span className="font-medium">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Montos */}
          <div>
            <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
              Montos
            </h3>
            <div className="space-y-2 text-sm max-w-md">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">{formatAmount(Number(invoice.subtotal))}</span>
              </div>
              
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Impuesto</span>
                  <span className="font-medium">{formatAmount(Number(invoice.tax))}</span>
                </div>
              )}
              
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Descuento</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatAmount(Number(invoice.discount))}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="font-semibold text-base">Total</span>
                <span className="font-bold text-lg">{formatAmount(Number(invoice.total))}</span>
              </div>
              
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500 dark:text-gray-400">Pagado</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatAmount(totalPaid)}
                    </span>
                  </div>
                  
                  {remainingBalance > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
                      <span className="font-semibold">Saldo Pendiente</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatAmount(remainingBalance)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pagos */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                Historial de Pagos
              </h3>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-900 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-sm">
                          {formatAmount(Number(payment.amount))}
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
                          {payment.status === "completed" ? "Completado" : payment.status === "failed" ? "Fallido" : payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.paymentGateway} • {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción y Notas */}
          {(invoice.description || invoice.notes) && (
            <div>
              <h3 className="font-semibold text-base mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                Información Adicional
              </h3>
              <div className="space-y-3 text-sm">
                {invoice.description && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Descripción
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">{invoice.description}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Notas
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">{invoice.notes}</p>
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
                Registrar Pago
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
