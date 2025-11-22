"use client";

import React from "react";
import { createRoot } from "react-dom/client";

import { SalesQuotationWithRelations } from "./types";

/**
 * Genera y descarga un PDF de la cotización desde HTML usando html2canvas + jsPDF
 * Esta función permite editar el PDF en tiempo real modificando el componente HTML
 */
export async function generateQuotationPDF(quotation: SalesQuotationWithRelations, preferences?: {
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
    import('jspdf'),
    import('html2canvas')
  ]);
  
  const jsPDF = jsPDFModule.default;
  const html2canvas = html2canvasModule.default;

  // Crear un iframe completamente aislado para evitar herencia de estilos
  const iframe = document.createElement('iframe');
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
      <div id="quotation-content"></div>
    </body>
    </html>
  `);
  iframeDoc.close();

  const container = iframeDoc.getElementById('quotation-content');
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

    // Renderizar el componente HTML de la cotización
    const QuotationHTML = await generateQuotationHTML(quotation, preferences);
    const root = createRoot(container);
    root.render(QuotationHTML);

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

    // Descargar el PDF
    pdf.save(`cotizacion-${quotation.quotationNumber}.pdf`);
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
 * Genera un PDF de la cotización en formato Base64
 */
export async function generateQuotationPDFBase64(quotation: SalesQuotationWithRelations, preferences?: {
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
    import('jspdf'),
    import('html2canvas')
  ]);
  
  const jsPDF = jsPDFModule.default;
  const html2canvas = html2canvasModule.default;

  // Crear un iframe completamente aislado para evitar herencia de estilos
  const iframe = document.createElement('iframe');
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
      <div id="quotation-content"></div>
    </body>
    </html>
  `);
  iframeDoc.close();

  const container = iframeDoc.getElementById('quotation-content');
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

    // Renderizar el componente HTML de la cotización
    const QuotationHTML = await generateQuotationHTML(quotation, preferences);
    const root = createRoot(container);
    root.render(QuotationHTML);

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
    const pdfOutput = pdf.output('datauristring');
    return pdfOutput.split(',')[1]; // Eliminar el prefijo
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
 * Genera el componente HTML de la cotización
 * Esta función se usa tanto para PDF como para impresión
 */
export async function generateQuotationHTML(quotation: SalesQuotationWithRelations, preferences?: {
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
  // Función para formatear montos
  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currency = preferences?.currency || 'BOB';
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
    
    // Agregar símbolo de moneda según el código
    const currencySymbols: Record<string, string> = {
      'BOB': 'Bs',
      'USD': '$',
      'EUR': '€',
      'BRL': 'R$',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${formatted} ${symbol}`;
  };

  // Obtener información del cliente
  const customerName = quotation.customer 
    ? `${quotation.customer.name || ''} ${quotation.customer.lastName || ''}`.trim()
    : quotation.customerName || 'Cliente sin registrar';
  
  const customerPhone = quotation.customer?.phone || quotation.customerPhone || '—';
  const customerEmail = quotation.customer?.email || '—';
  const customerAddress = quotation.customer?.address || '—';

  // Información de la empresa
  const companyName = preferences?.companyName || '';
  const companyNIT = preferences?.companyNIT || '';
  const companyAddress = preferences?.companyAddress || '';
  const companyPhone = preferences?.companyPhone || '';
  const ownerName = preferences?.ownerName || '';

  // Determinar color primario basado en el tema
  const themeColorMap: Record<string, string> = {
    green: '#1a7866',
    blue: '#60a5fa', // Azul claro como en la imagen
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
    }, 'Detalle de Cotización'),

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
        }, `Fecha y Hora: ${formatDateTime(quotation.createdAt)}`),
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

    // Secciones de datos del cliente y cotización
    React.createElement('div', {
      key: 'info-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px',
      }
    }, [
      // Datos del cliente
      React.createElement('div', { key: 'customer' }, [
        React.createElement('h2', {
          key: 'customer-title',
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
          key: 'customer-content',
          style: { fontSize: '10px', lineHeight: '1.6' }
        }, [
          React.createElement('p', { key: 'name', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'name-label' }, 'Cliente: '),
            React.createElement('span', { key: 'name-value' }, customerName)
          ]),
          customerPhone !== '—' ? React.createElement('p', { key: 'phone', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'phone-label' }, 'Teléfono: '),
            React.createElement('span', { key: 'phone-value' }, customerPhone)
          ]) : null,
          customerEmail !== '—' ? React.createElement('p', { key: 'email', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'email-label' }, 'Correo: '),
            React.createElement('span', { key: 'email-value' }, customerEmail)
          ]) : null,
          customerAddress !== '—' ? React.createElement('p', { key: 'address', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'address-label' }, 'Dirección: '),
            React.createElement('span', { key: 'address-value' }, customerAddress)
          ]) : null,
          quotation.notes ? React.createElement('p', { key: 'notes', style: { marginTop: '8px' } }, [
            React.createElement('strong', { key: 'notes-label' }, 'Detalle de Cotización: '),
            React.createElement('span', { key: 'notes-value' }, quotation.notes)
          ]) : null,
        ].filter(Boolean))
      ]),
      // Datos de la cotización
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
        }, 'Datos de la cotización'),
        React.createElement('div', {
          key: 'quotation-content',
          style: { fontSize: '10px', lineHeight: '1.6' }
        }, [
          React.createElement('p', { key: 'code', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'code-label' }, 'Código: '),
            React.createElement('span', { key: 'code-value' }, quotation.quotationNumber)
          ]),
          React.createElement('p', { key: 'created', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'created-label' }, 'Emitida: '),
            React.createElement('span', { key: 'created-value' }, formatDateTime(quotation.createdAt))
          ]),
          quotation.expiresAt ? React.createElement('p', { key: 'expires', style: { marginBottom: '4px' } }, [
            React.createElement('strong', { key: 'expires-label' }, 'Válido hasta: '),
            React.createElement('span', { key: 'expires-value' }, (() => {
              const d = new Date(quotation.expiresAt);
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${day}/${month}/${year}, ${hours}:${minutes}`;
            })())
          ]) : null,
          companyAddress ? React.createElement('p', { key: 'address', style: { marginTop: '8px' } }, [
            React.createElement('strong', { key: 'address-label' }, 'Dirección: '),
            React.createElement('span', { key: 'address-value' }, companyAddress)
          ]) : null,
        ].filter(Boolean))
      ]),
    ]),

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

    // Tabla de productos
    quotation.items && quotation.items.length > 0 ? React.createElement('div', { key: 'items', style: { marginBottom: '30px' } }, [
      React.createElement('h2', {
        key: 'items-title',
        style: {
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: primaryColor,
          textTransform: 'uppercase',
        }
      }, 'Detalle de Productos'),
      React.createElement('table', {
        key: 'items-table',
        style: {
          width: '100%',
          fontSize: '10px',
          borderCollapse: 'collapse',
        }
      }, [
        React.createElement('thead', { key: 'thead' }, [
          React.createElement('tr', { 
            key: 'header-row',
            style: { 
              backgroundColor: primaryColor,
              color: '#ffffff',
            } 
          }, [
            React.createElement('th', { 
              key: 'product', 
              style: { 
                padding: '8px 6px', 
                textAlign: 'left',
                fontWeight: 'bold',
              } 
            }, 'Nombre'),
            React.createElement('th', { 
              key: 'price', 
              style: { 
                padding: '8px 6px', 
                textAlign: 'right',
                fontWeight: 'bold',
              } 
            }, `Precio ${preferences?.currency || 'BOB'}`),
            React.createElement('th', { 
              key: 'quantity', 
              style: { 
                padding: '8px 6px', 
                textAlign: 'center',
                fontWeight: 'bold',
              } 
            }, 'Cantidad (U)'),
            React.createElement('th', { 
              key: 'subtotal', 
              style: { 
                padding: '8px 6px', 
                textAlign: 'right',
                fontWeight: 'bold',
              } 
            }, 'Subtotal'),
          ])
        ]),
        React.createElement('tbody', { key: 'tbody' }, 
          quotation.items.map((item, index) => 
            React.createElement('tr', { 
              key: `item-${index}`,
              style: { 
                backgroundColor: index % 2 === 0 ? '#f8f9fc' : '#ffffff',
                borderBottom: '1px solid #e5e5e5',
              } 
            }, [
              React.createElement('td', { 
                key: 'product', 
                style: { 
                  padding: '8px 6px',
                  color: '#2d2d2d',
                } 
              }, item.productName || item.product?.name || 'Producto sin nombre'),
              React.createElement('td', { 
                key: 'price', 
                style: { 
                  padding: '8px 6px', 
                  textAlign: 'right',
                  color: '#2d2d2d',
                } 
              }, formatAmount(item.unitPrice || 0)),
              React.createElement('td', { 
                key: 'quantity', 
                style: { 
                  padding: '8px 6px', 
                  textAlign: 'center',
                  color: '#2d2d2d',
                } 
              }, String(item.quantity || 0)),
              React.createElement('td', { 
                key: 'subtotal', 
                style: { 
                  padding: '8px 6px', 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#2d2d2d',
                } 
              }, formatAmount(item.subtotal || 0)),
            ])
          )
        )
      ])
    ]) : null,

    // Resumen de totales a la derecha
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
          fontSize: '10px',
          borderCollapse: 'collapse',
        }
      }, [
        React.createElement('tbody', { key: 'tbody' }, [
          React.createElement('tr', { key: 'subtotal' }, [
            React.createElement('td', { 
              key: 'label', 
              style: { 
                padding: '4px 0',
                textAlign: 'right',
                paddingRight: '10px',
              } 
            }, 'SUB TOTAL'),
            React.createElement('td', {
              key: 'value',
              style: { 
                padding: '4px 0', 
                textAlign: 'right',
                fontWeight: 'bold',
              }
            }, formatAmount(Number(quotation.subtotal || 0))),
          ]),
          React.createElement('tr', { key: 'discount' }, [
            React.createElement('td', { 
              key: 'label', 
              style: { 
                padding: '4px 0',
                textAlign: 'right',
                paddingRight: '10px',
              } 
            }, 'DESCUENTO'),
            React.createElement('td', {
              key: 'value',
              style: { 
                padding: '4px 0', 
                textAlign: 'right',
                fontWeight: 'bold',
              }
            }, formatAmount(Number(quotation.discount || 0))),
          ]),
          React.createElement('tr', {
            key: 'total',
          }, [
            React.createElement('td', {
              key: 'label',
              style: { 
                padding: '4px 0',
                textAlign: 'right',
                paddingRight: '10px',
                fontWeight: 'bold',
              }
            }, 'TOTAL'),
            React.createElement('td', {
              key: 'value',
              style: {
                padding: '4px 0',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '12px',
              }
            }, formatAmount(Number(quotation.total || 0))),
          ]),
        ])
      ])
    ]),

  ].filter(Boolean));
}

