"use client";

import { InvoiceWithRelations } from "@/lib/services/admin/billing-service";
import { formatDate, formatCurrency } from "./invoices-table";

interface InvoicePrintViewProps {
  invoice: InvoiceWithRelations;
}

export function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
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
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-view,
          .invoice-print-view * {
            visibility: visible;
          }
          .invoice-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 2cm;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="invoice-print-view hidden print:block bg-white text-black p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">FACTURA</h1>
          <div className="text-sm space-y-1">
            <p><strong>Número:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Fecha de Emisión:</strong> {formatDate(invoice.issueDate)}</p>
            <p><strong>Fecha de Vencimiento:</strong> {formatDate(invoice.dueDate)}</p>
            {invoice.paidAt && (
              <p><strong>Fecha de Pago:</strong> {formatDate(invoice.paidAt)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Información de Facturación</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {invoice.billingName}</p>
              <p><strong>Email:</strong> {invoice.billingEmail}</p>
              {invoice.billingAddress && (
                <p><strong>Dirección:</strong> {invoice.billingAddress}</p>
              )}
              {invoice.billingTaxId && (
                <p><strong>NIT / CUIT:</strong> {invoice.billingTaxId}</p>
              )}
            </div>
          </div>

          {(invoice.organization || invoice.subscriptionPlan) && (
            <div>
              <h2 className="text-lg font-bold mb-3 border-b pb-2">Información Relacionada</h2>
              <div className="space-y-2 text-sm">
                {invoice.organization && (
                  <p><strong>Organización:</strong> {invoice.organization.name}</p>
                )}
                {invoice.subscriptionPlan && (
                  <p><strong>Plan:</strong> {invoice.subscriptionPlan.name}</p>
                )}
                {invoice.subscription && (
                  <p>
                    <strong>Suscripción:</strong>{" "}
                    {invoice.subscription.billingPeriod === "monthly" ? "Mensual" : "Anual"}{" "}
                    {invoice.subscription.status === "active" ? "Activo" :
                     invoice.subscription.status === "cancelled" ? "Cancelada" :
                     invoice.subscription.status === "expired" ? "Expirada" :
                     invoice.subscription.status === "trial" ? "Prueba" :
                     invoice.subscription.status}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 border-b pb-2">Detalle de Montos</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2">Subtotal:</td>
                <td className="text-right py-2">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</td>
              </tr>
              {Number(invoice.tax) > 0 && (
                <tr>
                  <td className="py-2">Impuesto:</td>
                  <td className="text-right py-2">{formatCurrency(Number(invoice.tax), invoice.currency)}</td>
                </tr>
              )}
              {Number(invoice.discount) > 0 && (
                <tr>
                  <td className="py-2">Descuento:</td>
                  <td className="text-right py-2 text-red-600">-{formatCurrency(Number(invoice.discount), invoice.currency)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-black">
                <td className="py-2 font-bold">Total:</td>
                <td className="text-right py-2 font-bold text-lg">{formatCurrency(Number(invoice.total), invoice.currency)}</td>
              </tr>
              {totalPaid > 0 && (
                <>
                  <tr>
                    <td className="py-2">Pagado:</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(totalPaid, invoice.currency)}</td>
                  </tr>
                  {remainingBalance > 0 && (
                    <tr className="border-t">
                      <td className="py-2">Saldo Pendiente:</td>
                      <td className="text-right py-2 text-orange-600 font-semibold">{formatCurrency(remainingBalance, invoice.currency)}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {(invoice.description || invoice.notes) && (
          <div>
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Información Adicional</h2>
            <div className="space-y-2 text-sm">
              {invoice.description && (
                <p><strong>Descripción:</strong> {invoice.description}</p>
              )}
              {invoice.notes && (
                <p><strong>Notas:</strong> {invoice.notes}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

