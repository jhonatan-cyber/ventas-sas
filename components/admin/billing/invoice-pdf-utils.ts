"use client";

import React from "react";
import { createRoot } from "react-dom/client";

import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service";

/**
 * Genera y descarga un PDF de la factura desde HTML usando html2canvas + jsPDF
 * Esta función permite editar el PDF en tiempo real modificando el componente HTML
 */
export async function generateInvoicePDF(invoice: SerializedInvoiceWithRelations, preferences?: {
  companyName?: string;
  companyNIT?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyLogo?: string;
  themeColor?: string;
  currency?: string;
  ownerName?: string;
}) {
  // Importar dependencias dinámicamente para evitar problemas con SSR
  const [jsPDFModule, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas")
  ]);
  
  const jsPDF = jsPDFModule.default;
  const html2canvas = html2canvasModule.default;

  // Crear un iframe completamente aislado para evitar herencia de estilos oklch
  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm'; // Altura A4
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('No se pudo acceder al documento del iframe');
  }

  // Crear el HTML completo en el iframe sin heredar estilos del documento padre
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 210mm;
          padding: 20mm;
          background-color: #ffffff;
          color: #000000;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div id="invoice-content"></div>
    </body>
    </html>
  `);
  iframeDoc.close();

  const container = iframeDoc.getElementById('invoice-content');
  if (!container) {
    throw new Error('No se pudo crear el contenedor en el iframe');
  }

  try {
    // Esperar a que el iframe esté completamente cargado
    await new Promise(resolve => {
      if (iframe.contentWindow) {
        iframe.onload = resolve;
        if (iframe.contentDocument?.readyState === 'complete') {
          resolve(undefined);
        }
      } else {
        setTimeout(resolve, 100);
      }
    });

    // Renderizar el componente HTML de la factura
    const InvoiceHTML = await generateInvoiceHTML(invoice, preferences);
    const root = createRoot(container);
    root.render(InvoiceHTML);

    // Esperar a que se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capturar el HTML como canvas desde el iframe
    // El iframe está completamente aislado, por lo que no hereda estilos oklch
    const canvas = await html2canvas(container, {
      scale: 2, // Mayor calidad
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: iframe.contentWindow?.innerWidth || 794, // Ancho A4 en píxeles
      windowHeight: iframe.contentWindow?.innerHeight || 1123, // Altura A4 en píxeles
    });

    // Crear el PDF
    const pdfWidth = 210; // mm (A4 width)
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Mantener proporción
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    // Agregar la imagen al PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Descargar el PDF
    pdf.save(`factura-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  } finally {
    // Limpiar el iframe temporal
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Genera un PDF de la factura en formato Base64
 */
export async function generateInvoicePDFBase64(invoice: SerializedInvoiceWithRelations, preferences?: {
  companyName?: string;
  companyNIT?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyLogo?: string;
  themeColor?: string;
  currency?: string;
  ownerName?: string;
}): Promise<string> {
  // Importar dependencias dinámicamente para evitar problemas con SSR
  const [jsPDFModule, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas")
  ]);
  
  const jsPDF = jsPDFModule.default;
  const html2canvas = html2canvasModule.default;

  // Crear un iframe completamente aislado para evitar herencia de estilos oklch
  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm'; // Altura A4
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('No se pudo acceder al documento del iframe');
  }

  // Crear el HTML completo en el iframe sin heredar estilos del documento padre
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 210mm;
          padding: 20mm;
          background-color: #ffffff;
          color: #000000;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div id="invoice-content"></div>
    </body>
    </html>
  `);
  iframeDoc.close();

  const container = iframeDoc.getElementById('invoice-content');
  if (!container) {
    throw new Error('No se pudo crear el contenedor en el iframe');
  }

  try {
    // Esperar a que el iframe esté completamente cargado
    await new Promise(resolve => {
      if (iframe.contentWindow) {
        iframe.onload = resolve;
        if (iframe.contentDocument?.readyState === 'complete') {
          resolve(undefined);
        }
      } else {
        setTimeout(resolve, 100);
      }
    });

    // Renderizar el componente HTML de la factura
    const InvoiceHTML = await generateInvoiceHTML(invoice, preferences);
    const root = createRoot(container);
    root.render(InvoiceHTML);

    // Esperar a que se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capturar el HTML como canvas desde el iframe
    const canvas = await html2canvas(container, {
      scale: 2, // Mayor calidad
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: iframe.contentWindow?.innerWidth || 794, // Ancho A4 en píxeles
      windowHeight: iframe.contentWindow?.innerHeight || 1123, // Altura A4 en píxeles
    });

    // Crear el PDF
    const pdfWidth = 210; // mm (A4 width)
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Mantener proporción
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    // Agregar la imagen al PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Retornar Base64 (sin prefijo data:application/pdf;base64,)
    const pdfOutput = pdf.output("datauristring");
    return pdfOutput.split(",")[1]; // Eliminar el prefijo
  } catch (error) {
    console.error('Error al generar PDF Base64:', error);
    throw error;
  } finally {
    // Limpiar el iframe temporal
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Genera el componente HTML de la factura
 * Esta función se usa tanto para PDF como para impresión
 */
export async function generateInvoiceHTML(invoice: SerializedInvoiceWithRelations, preferences?: {
  companyName?: string;
  companyNIT?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyLogo?: string;
  themeColor?: string;
  currency?: string;
  ownerName?: string;
}): Promise<React.ReactElement> {
  const totalPaid = invoice.payments
    ? invoice.payments.reduce((sum, payment) => {
        if (payment.status === "completed") {
          return sum + Number(payment.amount);
        }
        return sum;
      }, 0)
    : 0;

  const remainingBalance = Number(invoice.total) - totalPaid;

  // Función para formatear montos
  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
    return `${formatted} Bs`;
  };

  // Información de la empresa
  const companyName = preferences?.companyName || invoice.organization?.name || '';
  const companyNIT = preferences?.companyNIT || '';
  const companyAddress = preferences?.companyAddress || '';
  const companyPhone = preferences?.companyPhone || '';
  const ownerName = preferences?.ownerName || (invoice.organization?.owner ? ((invoice.organization.owner as any).fullName || `${(invoice.organization.owner as any).nombre || ''} ${(invoice.organization.owner as any).apellido || ''}`.trim()) : '') || '';

  // Determinar el nombre de facturación
  const customer = invoice.organization?.customerOrganizations?.[0]?.customer;
  const customerName = customer ? `${customer.nombre || ''} ${customer.apellido || ''}`.trim() : '';
  const displayBillingName = ownerName || customerName || invoice.billingName;

  // Determinar color primario basado en el tema
  const themeColorMap: Record<string, string> = {
    green: '#1a7866',
    blue: '#60a5fa',
    purple: '#9333ea',
    orange: '#f97316',
    red: '#dc2626',
    pink: '#ec4899',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    indigo: '#6366f1',
    yellow: '#eab308',
    emerald: '#10b981',
    rose: '#e11d48',
  };
  const primaryColor = themeColorMap[preferences?.themeColor || 'green'] || themeColorMap.green;

  // Formatear fecha y hora
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  return React.createElement('div', {
    style: {
      width: '100%',
      maxWidth: '210mm',
      margin: '0 auto',
      padding: '20mm',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.6',
    }
  }, [
    // Título centrado arriba
    React.createElement('h1', {
      key: 'title',
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
        color: primaryColor,
      }
    }, 'Detalle de Factura'),

    // Encabezado con información de empresa y contacto
    React.createElement('div', { 
      key: 'header', 
      style: { 
        marginBottom: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      } 
    }, [
      // Información de empresa a la izquierda
      React.createElement('div', { 
        key: 'company-info',
        style: {
          flex: '1',
        }
      }, [
        companyName ? React.createElement('p', {
          key: 'company-name',
          style: {
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#000000',
          }
        }, companyName) : null,
        companyNIT ? React.createElement('p', {
          key: 'company-nit',
          style: {
            fontSize: '10px',
            marginBottom: '3px',
            color: '#606060',
          }
        }, `NIT: ${companyNIT}`) : null,
        companyAddress ? React.createElement('p', {
          key: 'company-address',
          style: {
            fontSize: '10px',
            marginBottom: '3px',
            color: '#606060',
          }
        }, companyAddress) : null,
        React.createElement('p', {
          key: 'company-date',
          style: {
            fontSize: '10px',
            marginTop: '5px',
            color: '#606060',
          }
        }, `Fecha y Hora: ${formatDateTime(invoice.issueDate)}`),
      ].filter(Boolean)),

      // Logo y contacto a la derecha
      React.createElement('div', {
        key: 'contact-info',
        style: {
          textAlign: 'right',
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }
      }, [
        preferences?.companyLogo ? React.createElement('img', {
          key: 'logo',
          src: preferences.companyLogo,
          alt: 'Logo',
          style: {
            maxHeight: '50px',
            maxWidth: '120px',
            objectFit: 'contain',
            marginBottom: '8px',
            display: 'block',
          }
        }) : null,
        ownerName ? React.createElement('p', {
          key: 'owner-name',
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '4px',
            color: '#000000',
            marginTop: preferences?.companyLogo ? '0' : '0',
          }
        }, ownerName) : null,
        companyPhone ? React.createElement('p', {
          key: 'contact-phone',
          style: {
            fontSize: '10px',
            color: '#606060',
            marginTop: '0',
          }
        }, `Contactos: ${companyPhone}`) : null,
      ].filter(Boolean)),
    ]),

    // Línea divisoria
    React.createElement('div', {
      key: 'divider-top',
      style: {
        width: '100%',
        height: '2px',
        backgroundColor: primaryColor,
        marginBottom: '20px',
      }
    }),

    // Información de Facturación y Relacionada
    React.createElement('div', {
      key: 'info-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px',
      }
    }, [
      React.createElement('div', { key: 'billing' }, [
        React.createElement('h2', {
          key: 'billing-title',
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: `2px solid ${primaryColor}`,
            color: primaryColor,
            textTransform: 'uppercase',
          }
        }, 'Datos del cliente'),
        React.createElement('div', {
          key: 'billing-content',
          style: { fontSize: '11px', lineHeight: '1.8' }
        }, [
          React.createElement('p', { key: 'name' }, [
            React.createElement('strong', { key: 'name-label' }, 'Nombre: '),
            React.createElement('span', { key: 'name-value' }, displayBillingName)
          ]),
          React.createElement('p', { key: 'email' }, [
            React.createElement('strong', { key: 'email-label' }, 'Email: '),
            React.createElement('span', { key: 'email-value' }, invoice.billingEmail)
          ]),
          invoice.billingAddress ? React.createElement('p', { key: 'address' }, [
            React.createElement('strong', { key: 'address-label' }, 'Dirección: '),
            React.createElement('span', { key: 'address-value' }, invoice.billingAddress)
          ]) : null,
          invoice.billingTaxId ? React.createElement('p', { key: 'taxId' }, [
            React.createElement('strong', { key: 'taxId-label' }, 'NIT / CUIT: '),
            React.createElement('span', { key: 'taxId-value' }, invoice.billingTaxId)
          ]) : null,
        ].filter(Boolean))
      ]),
      React.createElement('div', { key: 'quotation' }, [
        React.createElement('h2', {
          key: 'quotation-title',
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: `2px solid ${primaryColor}`,
            color: primaryColor,
            textTransform: 'uppercase',
          }
        }, 'Datos de la factura'),
        React.createElement('div', {
          key: 'quotation-content',
          style: { fontSize: '10px', lineHeight: '1.6' }
        }, [
          React.createElement('p', { key: 'code', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'code-label' }, 'Código: '),
            React.createElement('span', { key: 'code-value' }, invoice.invoiceNumber)
          ]),
          React.createElement('p', { key: 'created', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'created-label' }, 'Emitida: '),
            React.createElement('span', { key: 'created-value' }, formatDateTime(invoice.issueDate))
          ]),
          invoice.dueDate ? React.createElement('p', { key: 'expires', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'expires-label' }, 'Válido hasta: '),
            React.createElement('span', { key: 'expires-value' }, formatDateTime(invoice.dueDate))
          ]) : null,
          invoice.paidAt ? React.createElement('p', { key: 'paidAt', style: { marginTop: '8px' } }, [
            React.createElement('strong', { key: 'paidAt-label' }, 'Fecha de Pago: '),
            React.createElement('span', { key: 'paidAt-value' }, formatDateTime(invoice.paidAt))
          ]) : null,
          companyAddress ? React.createElement('p', { key: 'address', style: { marginTop: '8px' } }, [
            React.createElement('strong', { key: 'address-label' }, 'Dirección: '),
            React.createElement('span', { key: 'address-value' }, companyAddress)
          ]) : null,
        ].filter(Boolean))
      ]),
      (invoice.organization || invoice.subscriptionPlan) ? React.createElement('div', { key: 'related' }, [
        React.createElement('h2', {
          key: 'related-title',
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: `2px solid ${primaryColor}`,
            color: primaryColor,
            textTransform: 'uppercase',
          }
        }, 'Información Relacionada'),
        React.createElement('div', {
          key: 'related-content',
          style: { fontSize: '11px', lineHeight: '1.8' }
        }, [
          invoice.organization ? React.createElement('p', { key: 'org' }, [
            React.createElement('strong', { key: 'org-label' }, 'Organización: '),
            React.createElement('span', { key: 'org-value' }, invoice.organization.name)
          ]) : null,
          invoice.subscriptionPlan ? React.createElement('p', { key: 'plan' }, [
            React.createElement('strong', { key: 'plan-label' }, 'Plan: '),
            React.createElement('span', { key: 'plan-value' }, invoice.subscriptionPlan.name)
          ]) : null,
          invoice.subscription ? React.createElement('p', { key: 'sub' }, [
            React.createElement('strong', { key: 'sub-label' }, 'Suscripción: '),
            React.createElement('span', { key: 'sub-value' }, `${invoice.subscription.billingPeriod === "monthly" ? "Mensual" : "Anual"} ${
              invoice.subscription.status === "active" ? "Activo" :
              invoice.subscription.status === "cancelled" ? "Cancelada" :
              invoice.subscription.status === "expired" ? "Expirada" :
              invoice.subscription.status === "trial" ? "Prueba" :
              invoice.subscription.status
            }`)
          ]) : null,
        ].filter(Boolean))
      ]) : null,
    ].filter(Boolean)),

    // Línea divisoria
    React.createElement('div', {
      key: 'divider-middle',
      style: {
        width: '100%',
        height: '2px',
        backgroundColor: primaryColor,
        marginBottom: '20px',
      }
    }),

    // Detalle de Montos
    React.createElement('div', { 
      key: 'amounts', 
      style: { 
        marginTop: '20px',
        marginBottom: '30px',
        textAlign: 'right',
      } 
    }, [
      React.createElement('h2', {
        key: 'amounts-title',
        style: {
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: primaryColor,
          textTransform: 'uppercase',
        }
      }, 'Resumen de Totales'),
      React.createElement('table', {
        key: 'amounts-table',
        style: {
          width: '100%',
          fontSize: '11px',
          borderCollapse: 'collapse',
        }
      }, [
        React.createElement('tbody', { key: 'tbody' }, [
          React.createElement('tr', { key: 'subtotal' }, [
            React.createElement('td', { key: 'label', style: { padding: '8px 0' } }, 'Subtotal:'),
            React.createElement('td', {
              key: 'value',
              style: { padding: '8px 0', textAlign: 'right' }
            }, formatAmount(Number(invoice.subtotal))),
          ]),
          Number(invoice.tax) > 0 ? React.createElement('tr', { key: 'tax' }, [
            React.createElement('td', { key: 'label', style: { padding: '8px 0' } }, 'Impuesto:'),
            React.createElement('td', {
              key: 'value',
              style: { padding: '8px 0', textAlign: 'right' }
            }, formatAmount(Number(invoice.tax))),
          ]) : null,
          Number(invoice.discount) > 0 ? React.createElement('tr', { key: 'discount' }, [
            React.createElement('td', { key: 'label', style: { padding: '8px 0' } }, 'Descuento:'),
            React.createElement('td', {
              key: 'value',
              style: { padding: '8px 0', textAlign: 'right', color: '#dc2626' }
            }, `-${formatAmount(Number(invoice.discount))}`),
          ]) : null,
          React.createElement('tr', {
            key: 'total',
            style: { borderTop: '2px solid #000000' }
          }, [
            React.createElement('td', {
              key: 'label',
              style: { padding: '8px 0', fontWeight: 'bold' }
            }, 'Total:'),
            React.createElement('td', {
              key: 'value',
              style: {
                padding: '8px 0',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '14px'
              }
            }, formatAmount(Number(invoice.total))),
          ]),
          totalPaid > 0 ? React.createElement('tr', { key: 'paid' }, [
            React.createElement('td', { key: 'label', style: { padding: '8px 0' } }, 'Pagado:'),
            React.createElement('td', {
              key: 'value',
              style: { padding: '8px 0', textAlign: 'right', color: '#16a34a' }
            }, formatAmount(totalPaid)),
          ]) : null,
          remainingBalance > 0 ? React.createElement('tr', {
            key: 'balance',
            style: { borderTop: '1px solid #000000' }
          }, [
            React.createElement('td', {
              key: 'label',
              style: { padding: '8px 0', fontWeight: 'bold' }
            }, 'Saldo Pendiente:'),
            React.createElement('td', {
              key: 'value',
              style: {
                padding: '8px 0',
                textAlign: 'right',
                fontWeight: 'bold',
                color: '#ea580c'
              }
            }, formatAmount(remainingBalance)),
          ]) : null,
        ].filter(Boolean))
      ])
    ]),

    // Información Adicional
    (invoice.description || invoice.notes) ? React.createElement('div', { key: 'additional' }, [
      React.createElement('h2', {
        key: 'additional-title',
        style: {
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '8px',
          paddingBottom: '4px',
          borderBottom: `2px solid ${primaryColor}`,
          color: primaryColor,
          textTransform: 'uppercase',
        }
      }, 'Notas Adicionales'),
      React.createElement('div', {
        key: 'additional-content',
        style: { fontSize: '11px', lineHeight: '1.8' }
      }, [
        invoice.description ? React.createElement('p', { key: 'desc' }, [
          React.createElement('strong', { key: 'desc-label' }, 'Descripción: '),
          React.createElement('span', { key: 'desc-value' }, invoice.description)
        ]) : null,
        invoice.notes ? React.createElement('p', { key: 'notes' }, [
          React.createElement('strong', { key: 'notes-label' }, 'Notas: '),
          React.createElement('span', { key: 'notes-value' }, invoice.notes)
        ]) : null,
      ].filter(Boolean))
    ]) : null,
  ].filter(Boolean));
}

