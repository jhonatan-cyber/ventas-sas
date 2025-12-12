"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

import { BillingContainer } from "./billing-container"
import { BillingHeader } from "./billing-header"
import { InvoiceDetailDialog } from "./invoice-detail-dialog"
import { InvoiceFormDialog } from "./invoice-form-dialog"
import { generateInvoicePDF, generateInvoicePDFBase64 } from "./invoice-pdf-utils"
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
      // Cargar preferencias de la organización si existe
      let preferences: {
        companyName?: string;
        companyNIT?: string;
        companyAddress?: string;
        companyWebsite?: string;
        companyPhone?: string;
        companyLogo?: string;
        themeColor?: string;
        currency?: string;
        ownerName?: string;
      } = {};

      if (invoice.organization?.id) {
        try {
          const orgResponse = await fetch(`/api/administracion/organizations/${invoice.organization.id}`)
          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            if (orgData.success && orgData.organization) {
              const org = orgData.organization
              const settings = org.settings as any || {}
              
              preferences = {
                companyName: org.razonSocial || org.name || undefined,
                companyNIT: org.nit || undefined,
                companyAddress: org.address || undefined,
                companyPhone: org.phone || undefined,
                companyLogo: org.logoUrl || undefined,
                themeColor: settings.themeColor || 'green',
                currency: settings.currency || 'BOB',
                ownerName: org.owner ? `${org.owner.nombre} ${org.owner.apellido}`.trim() : undefined,
              }
            }
          }
        } catch (prefError) {
          console.error("Error cargando preferencias:", prefError)
          // Continuar sin preferencias si falla
        }
      }

      // Primero generar PDF en Base64 para subirlo al servidor (si es necesario)
      // Por ahora solo generamos y descargamos directamente
      
      // Solo después de que todo termine, descargar el PDF localmente
      await generateInvoicePDF(invoice as any, preferences)
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

  // Función para enviar credenciales por WhatsApp
  const handleSendWhatsApp = async (invoice: SerializedInvoiceWithRelations) => {
    let toastId: string | number | undefined
    
    try {
      // Verificar que la factura tenga organización
      if (!invoice.organization) {
        toast.error('La factura no tiene una organización asociada')
        return
      }

      toastId = toast.loading('Preparando mensaje de WhatsApp...')

      const org = invoice.organization

      // Buscar número de teléfono en diferentes lugares (prioridad):
      // 1. Owner phone
      // 2. Organization phone
      // 3. Customer phone (primer cliente asociado)
      let phoneNumber = org.owner?.phone || org.phone

      // Si no hay teléfono en owner ni organización, buscar en clientes
      if (!phoneNumber && org.customerOrganizations && org.customerOrganizations.length > 0) {
        const firstCustomer = org.customerOrganizations[0]?.customer
        phoneNumber = firstCustomer?.phone
      }

      // Si aún no hay teléfono, mostrar error
      if (!phoneNumber) {
        toast.dismiss(toastId)
        toast.error('No se encontró un número de teléfono para enviar el mensaje. Verifica que la organización, el dueño o el cliente tengan un teléfono registrado.')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const loginUrl = `${baseUrl}/${org.slug}/login`
      const credentialsUrl = `${baseUrl}/api/administracion/billing/credentials-pdf?invoiceId=${invoice.id}`

      // Construir mensaje de WhatsApp
      const message = `*Bienvenido a ${org.razonSocial || org.name}!*

Tu cuenta ha sido activada exitosamente. Aqui estan tus credenciales de acceso:

*Email:* ${org.owner?.email || 'No disponible'}
*Contrasena:* Tu numero de cedula de identidad (CI)

*Accede a tu sistema aqui:*
${loginUrl}

*Descarga tus credenciales en PDF:*
${credentialsUrl}

*Factura #${invoice.invoiceNumber}* - ${(() => {
  const amount = Number(invoice.total)
  const currency = invoice.currency || 'BOB'
  const formatted = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return currency === 'BOB' ? `${formatted} Bs` : formatted
})()}

*IMPORTANTE:* Por seguridad, te recomendamos cambiar tu contrasena despues del primer inicio de sesion.

Necesitas ayuda? Estamos aqui para asistirte.`

      // Limpiar número de teléfono (eliminar espacios, guiones, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
      
      // Crear URL de WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

      // Abrir WhatsApp en una nueva ventana
      window.open(whatsappUrl, '_blank')
      
      // Cerrar el toast de loading y mostrar éxito
      toast.success('Mensaje de WhatsApp preparado. Se abrirá en una nueva ventana.', {
        id: toastId
      })
    } catch (error) {
      console.error('Error al preparar mensaje de WhatsApp:', error)
      
      // Asegurar que el toast se cierre
      if (toastId) {
        toast.dismiss(toastId)
      }
      
      toast.error(error instanceof Error ? error.message : 'Error al preparar mensaje de WhatsApp')
    }
  }

  // Función para enviar credenciales por email
  const handleSendCredentials = async (invoice: SerializedInvoiceWithRelations) => {
    try {
      const toastId = toast.loading('Generando PDF y enviando credenciales...')

      // Cargar preferencias de la organización si existe
      let preferences: {
        companyName?: string;
        companyNIT?: string;
        companyAddress?: string;
        companyWebsite?: string;
        companyPhone?: string;
        companyLogo?: string;
        themeColor?: string;
        currency?: string;
        ownerName?: string;
      } = {};

      if (invoice.organization?.id) {
        try {
          const orgResponse = await fetch(`/api/administracion/organizations/${invoice.organization.id}`)
          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            if (orgData.success && orgData.organization) {
              const org = orgData.organization
              const settings = org.settings as any || {}
              
              preferences = {
                companyName: org.razonSocial || org.name || undefined,
                companyNIT: org.nit || undefined,
                companyAddress: org.address || undefined,
                companyPhone: org.phone || undefined,
                companyLogo: org.logoUrl || undefined,
                themeColor: settings.themeColor || 'green',
                currency: settings.currency || 'BOB',
                ownerName: org.owner ? `${org.owner.nombre} ${org.owner.apellido}`.trim() : undefined,
              }
            }
          }
        } catch (prefError) {
          console.error("Error cargando preferencias:", prefError)
          // Continuar sin preferencias si falla
        }
      }

      // Generar PDF en Base64
      const pdfBase64 = await generateInvoicePDFBase64(invoice, preferences)

      const response = await fetch('/api/administracion/billing/send-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          invoiceId: invoice.id,
          pdfBase64: pdfBase64,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar credenciales')
      }

      toast.dismiss(toastId)
      toast.success('Credenciales enviadas exitosamente por email')
    } catch (error) {
      console.error('Error al enviar credenciales:', error)
      toast.dismiss()
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
          onSendWhatsApp={handleSendWhatsApp}
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
