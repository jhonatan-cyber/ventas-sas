"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

import { BillingContainer } from "./billing-container"
import { BillingHeader } from "./billing-header"
import { InvoiceDetailDialog } from "./invoice-detail-dialog"
import { InvoiceFormDialog } from "./invoice-form-dialog"
import { generateInvoicePDF } from "./invoice-pdf-utils"
import { InvoicePrintView } from "./invoice-print-view"
import { PaymentFormDialog } from "./payment-form-dialog"

import { AdminLayout } from "@/components/layout/admin-layout"
import { SerializedInvoiceWithRelations, SerializedBillingStats } from "@/lib/services/admin/billing-service"


interface BillingPageClientProps {
  initialInvoices: SerializedInvoiceWithRelations[]
  initialStats: SerializedBillingStats
}

export function BillingPageClient({ initialInvoices, initialStats }: BillingPageClientProps) {
  const [invoices, setInvoices] = useState<SerializedInvoiceWithRelations[]>(initialInvoices)
  const [stats, setStats] = useState<SerializedBillingStats>(initialStats)
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<SerializedInvoiceWithRelations | null>(null)
  const [invoiceToPrint, setInvoiceToPrint] = useState<SerializedInvoiceWithRelations | null>(null)

  // Recargar facturas después de guardar
  useEffect(() => {
    const reloadInvoices = async () => {
      try {
        const response = await fetch('/api/administracion/billing?page=1&pageSize=1000&includeStats=true')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setInvoices(data.invoices)
            if (data.stats) {
              setStats(data.stats)
            }
          }
        }
      } catch (error) {
        console.error('Error recargando facturas:', error)
      }
    }

    // Escuchar eventos de recarga
    const handleReload = () => reloadInvoices()
    window.addEventListener('invoice-updated', handleReload)
    
    return () => {
      window.removeEventListener('invoice-updated', handleReload)
    }
  }, [])

  // Actualizar facturas cuando cambien los initialInvoices
  useEffect(() => {
    setInvoices(initialInvoices)
    setStats(initialStats)
  }, [initialInvoices, initialStats])

  // Función para descargar PDF
  const handleDownloadPDF = async (invoice: SerializedInvoiceWithRelations) => {
    try {
      await generateInvoicePDF(invoice as any)
      toast.success("PDF descargado exitosamente")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast.error("Error al generar el PDF")
    }
  }

  // Función para imprimir
  const handlePrintInvoice = (invoice: SerializedInvoiceWithRelations) => {
    setInvoiceToPrint(invoice)
    // Usar setTimeout para asegurar que el componente se renderice antes de imprimir
    setTimeout(() => {
      window.print()
      // Limpiar después de imprimir
      setTimeout(() => {
        setInvoiceToPrint(null)
      }, 1000)
    }, 100)
  }

  // Función para enviar credenciales por email
  const handleSendCredentials = async (invoice: SerializedInvoiceWithRelations) => {
    try {
      const response = await fetch('/api/administracion/billing/send-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar credenciales')
      }

      toast.success('Credenciales enviadas exitosamente por email')
    } catch (error) {
      console.error('Error al enviar credenciales:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar credenciales')
    }
  }

  // Función para ver detalles
  const handleView = (invoice: SerializedInvoiceWithRelations) => {
    setSelectedInvoice(invoice)
    setIsInvoiceDetailOpen(true)
  }

  // Función para crear nueva factura
  const handleNewClick = () => {
    setIsInvoiceFormOpen(true)
  }

  // Función para guardar factura
  const handleSave = () => {
    setIsInvoiceFormOpen(false)
    window.dispatchEvent(new Event('invoice-updated'))
  }

  // Función para agregar pago
  const handleAddPayment = () => {
    setIsInvoiceDetailOpen(false)
    setIsPaymentFormOpen(true)
  }

  // Función para guardar pago
  const handleSavePayment = async () => {
    setIsPaymentFormOpen(false)
    setIsInvoiceDetailOpen(false)
    setSelectedInvoice(null)
    window.dispatchEvent(new Event('invoice-updated'))
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header con título y botón */}
        <BillingHeader
          title="Facturación y Pagos"
          description="Gestiona facturas, pagos y métodos de pago del sistema"
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <BillingContainer 
          invoices={invoices} 
          stats={stats}
          onView={handleView}
          onDownloadPDF={handleDownloadPDF}
          onPrintInvoice={handlePrintInvoice}
          onSendCredentials={handleSendCredentials}
        />

        {/* Modal de crear/editar factura */}
        <InvoiceFormDialog
          open={isInvoiceFormOpen}
          onOpenChange={setIsInvoiceFormOpen}
          onSave={handleSave}
        />

        {/* Modal de detalles de la factura */}
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          open={isInvoiceDetailOpen}
          onOpenChange={(open) => {
            setIsInvoiceDetailOpen(open)
            if (!open) {
              setSelectedInvoice(null)
            }
          }}
          onAddPayment={handleAddPayment}
        />

        {/* Modal de registrar pago */}
        <PaymentFormDialog
          invoice={selectedInvoice}
          open={isPaymentFormOpen}
          onOpenChange={(open) => {
            setIsPaymentFormOpen(open)
            if (!open) {
              setSelectedInvoice(null)
            }
          }}
          onSave={handleSavePayment}
        />

        {/* Vista de impresión */}
        {invoiceToPrint && (
          <InvoicePrintView invoice={invoiceToPrint} />
        )}
      </div>
    </AdminLayout>
  )
}
