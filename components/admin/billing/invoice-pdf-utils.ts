"use client";

import { InvoiceWithRelations } from "@/lib/services/admin/billing-service";
import { formatDate, formatCurrency } from "./invoices-table";

/**
 * Genera y descarga un PDF de la factura
 */
export async function generateInvoicePDF(invoice: InvoiceWithRelations) {
  // Importar jsPDF dinámicamente para evitar problemas con SSR
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const doc = new jsPDF();

  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Número: ${invoice.invoiceNumber}`, margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${formatDate(invoice.issueDate)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Fecha de Vencimiento: ${formatDate(invoice.dueDate)}`, margin, yPosition);
  
  if (invoice.paidAt) {
    yPosition += 6;
    doc.text(`Fecha de Pago: ${formatDate(invoice.paidAt)}`, margin, yPosition);
  }

  yPosition += 15;

  // Información de Facturación
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información de Facturación", margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${invoice.billingName}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Email: ${invoice.billingEmail}`, margin, yPosition);
  
  if (invoice.billingAddress) {
    yPosition += 6;
    doc.text(`Dirección: ${invoice.billingAddress}`, margin, yPosition);
  }
  
  if (invoice.billingTaxId) {
    yPosition += 6;
    doc.text(`NIT / CUIT: ${invoice.billingTaxId}`, margin, yPosition);
  }

  yPosition += 15;

  // Información Relacionada
  if (invoice.organization || invoice.subscriptionPlan) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Información Relacionada", margin, yPosition);
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (invoice.organization) {
      doc.text(`Organización: ${invoice.organization.name}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (invoice.subscriptionPlan) {
      doc.text(`Plan: ${invoice.subscriptionPlan.name}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (invoice.subscription) {
      const period = invoice.subscription.billingPeriod === "monthly" ? "Mensual" : "Anual";
      const status = invoice.subscription.status === "active" ? "Activo" :
        invoice.subscription.status === "cancelled" ? "Cancelada" :
        invoice.subscription.status === "expired" ? "Expirada" :
        invoice.subscription.status === "trial" ? "Prueba" : invoice.subscription.status;
      doc.text(`Suscripción: ${period} ${status}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 10;
  }

  // Montos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Montos", margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const lineHeight = 7;
  const rightAlign = pageWidth - margin - 40;
  
  doc.text("Subtotal:", margin, yPosition);
  doc.text(formatCurrency(Number(invoice.subtotal), invoice.currency), rightAlign, yPosition, { align: "right" });
  yPosition += lineHeight;

  if (Number(invoice.tax) > 0) {
    doc.text("Impuesto:", margin, yPosition);
    doc.text(formatCurrency(Number(invoice.tax), invoice.currency), rightAlign, yPosition, { align: "right" });
    yPosition += lineHeight;
  }

  if (Number(invoice.discount) > 0) {
    doc.text("Descuento:", margin, yPosition);
    doc.text(`-${formatCurrency(Number(invoice.discount), invoice.currency)}`, rightAlign, yPosition, { align: "right" });
    yPosition += lineHeight;
  }

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", margin, yPosition);
  doc.text(formatCurrency(Number(invoice.total), invoice.currency), rightAlign, yPosition, { align: "right" });
  yPosition += lineHeight;

  // Resumen de Pagos (solo total pagado y saldo pendiente, sin historial)
  if (invoice.payments && invoice.payments.length > 0) {
    const totalPaid = invoice.payments.reduce((sum, payment) => {
      if (payment.status === "completed") {
        return sum + Number(payment.amount);
      }
      return sum;
    }, 0);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pagado:", margin, yPosition);
    doc.text(formatCurrency(totalPaid, invoice.currency), rightAlign, yPosition, { align: "right" });
    yPosition += lineHeight;

    const remainingBalance = Number(invoice.total) - totalPaid;
    if (remainingBalance > 0) {
      yPosition += 3;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      doc.text("Saldo Pendiente:", margin, yPosition);
      doc.text(formatCurrency(remainingBalance, invoice.currency), rightAlign, yPosition, { align: "right" });
    }
  }

  // Descripción y Notas
  if (invoice.description || invoice.notes) {
    yPosition += 10;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Información Adicional", margin, yPosition);
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (invoice.description) {
      const descLines = doc.splitTextToSize(`Descripción: ${invoice.description}`, contentWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5;
    }
    
    if (invoice.notes) {
      yPosition += 5;
      const notesLines = doc.splitTextToSize(`Notas: ${invoice.notes}`, contentWidth);
      doc.text(notesLines, margin, yPosition);
    }
  }

  // Descargar PDF
  doc.save(`factura-${invoice.invoiceNumber}.pdf`);
}

