"use client";

import { useEffect, useRef } from "react";
import { createRoot, Root } from "react-dom/client";

import { generateInvoiceHTML } from "./invoice-pdf-utils";

import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service";

interface InvoicePrintViewProps {
  invoice: SerializedInvoiceWithRelations;
}

export function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!invoice || !containerRef.current) return;

    const renderInvoice = async () => {
      try {
        const InvoiceHTML = await generateInvoiceHTML(invoice);
        
        // Reutilizar el root existente o crear uno nuevo
        if (!rootRef.current) {
          rootRef.current = createRoot(containerRef.current!);
        }
        
        rootRef.current.render(InvoiceHTML);
      } catch (error) {
        console.error('Error al renderizar factura para impresión:', error);
      }
    };

    renderInvoice();

    // Cleanup: limpiar el root cuando el componente se desmonte
    return () => {
      if (rootRef.current) {
        rootRef.current.render(null);
        rootRef.current = null;
      }
    };
  }, [invoice]);

  if (!invoice) return null;

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
          }
          @page {
            margin: 0;
            size: A4;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .invoice-print-view {
            display: none;
          }
        }
      `}</style>
      <div 
        ref={containerRef}
        className="invoice-print-view"
        style={{
          width: '210mm',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
        }}
      />
    </>
  );
}

