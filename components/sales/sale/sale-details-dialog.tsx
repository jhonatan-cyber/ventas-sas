"use client"

import jsPDF from "jspdf"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SalesSaleWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils/date"
import { generateSalePdfAndPrint } from "@/lib/utils/pdf-sale-print"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"
import { getTranslatableText } from "@/lib/utils/translatable-text"

interface SaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SalesSaleWithRelations | null
  customerSlug: string
  maxBranches?: number
}

const statusTokens: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completada",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
}

const paymentTokens: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  qr: "QR / Billetera",
}

const DEFAULT_CURRENCY = "BOB"

export function SaleDetailsDialog({ open, onOpenChange, sale, customerSlug, maxBranches: _maxBranches }: SaleDetailsDialogProps) {
  const t = useTranslations()
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [companyContactName, setCompanyContactName] = useState<string>("")
  const [companyPhone, setCompanyPhone] = useState<string>("")
  const [companyAddress, setCompanyAddress] = useState<string>("")
  const [companyWebsite, setCompanyWebsite] = useState<string>("")
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [companyWhatsappNumber, setCompanyWhatsappNumber] = useState<string>("")
  const [companyNIT, setCompanyNIT] = useState<string>("")
  const [ownerName, setOwnerName] = useState<string>("")
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY)
  const [themeColorKey, setThemeColorKey] = useState<string>("green")

  // const showBranchInfo = maxBranches === undefined || maxBranches > 1 // No disponible: SalesUser no tiene relación con Branch

  useEffect(() => {
    if (!open) {
      setShareUrl(null)
    }
  }, [open])

  useEffect(() => {
    setShareUrl(null)
  }, [sale?.id])

  const handleOpenShareUrl = useCallback(() => {
    if (!shareUrl) return
    if (typeof window !== "undefined") {
      window.open(shareUrl, "_blank", "noopener,noreferrer")
    }
  }, [shareUrl])

  useEffect(() => {
    if (typeof document === "undefined") return

    // Cargar moneda desde la API
    const loadCurrencyAndTheme = async () => {
      try {
        const response = await fetch(`/api/${customerSlug}/config/preferencias`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data?.success && data.configuration) {
            if (data.configuration.currency) {
              setCurrencyCode(data.configuration.currency)
            } else {
              setCurrencyCode(DEFAULT_CURRENCY)
            }
            if (data.configuration.themeColor) {
              setThemeColorKey(data.configuration.themeColor)
            }
          } else {
            setCurrencyCode(DEFAULT_CURRENCY)
          }
        } else {
          setCurrencyCode(DEFAULT_CURRENCY)
        }
      } catch {
        setCurrencyCode(DEFAULT_CURRENCY)
      }
    }

    // Cargar información de empresa desde cookies (temporal, hasta migrar a BD)
    // TODO: Migrar esta información a la base de datos
    try {
      const raw = document.cookie
        .split("; ")
        .find((chunk) => chunk.startsWith(`sas-prefs-${customerSlug}=`))
        ?.split("=")[1]
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw))
        const value = typeof parsed.whatsappNumber === "string" ? parsed.whatsappNumber : ""
        setCompanyWhatsappNumber(value)
        setCompanyName(typeof parsed.companyName === "string" ? parsed.companyName : "")
        setCompanyContactName(typeof parsed.companyContactName === "string" ? parsed.companyContactName : "")
        setCompanyPhone(typeof parsed.companyPhone === "string" ? parsed.companyPhone : "")
        setCompanyAddress(typeof parsed.companyAddress === "string" ? parsed.companyAddress : "")
        setCompanyWebsite(typeof parsed.companyWebsite === "string" ? parsed.companyWebsite : "")
        setCompanyLogo(typeof parsed.companyLogo === "string" ? parsed.companyLogo : "")
        setCompanyNIT(typeof parsed.companyNIT === "string" ? parsed.companyNIT : "")
        setOwnerName(typeof parsed.companyContactName === "string" ? parsed.companyContactName : "")
      } else {
        // Valores por defecto si no hay cookies
        setCompanyWhatsappNumber("")
        setCompanyName("")
        setCompanyContactName("")
        setCompanyPhone("")
        setCompanyAddress("")
        setCompanyWebsite("")
        setCompanyLogo("")
        setCompanyNIT("")
        setOwnerName("")
      }
    } catch {
      setCompanyWhatsappNumber("")
      setCompanyName("")
      setCompanyContactName("")
      setCompanyPhone("")
      setCompanyAddress("")
      setCompanyWebsite("")
      setCompanyLogo("")
      setCompanyNIT("")
      setOwnerName("")
    }

    const loadOrganization = async () => {
      try {
        const orgRes = await fetch(`/api/${customerSlug}/organizacion`, { credentials: "include" })
        if (orgRes.ok) {
          const data = await orgRes.json()
          const org = data?.organization
          if (org) {
            setCompanyName((prev) => prev || org.razonSocial || org.name || "")
            setCompanyAddress((prev) => prev || org.address || "")
            setCompanyWebsite((prev) => prev || org.website || "")
            setCompanyNIT((prev) => prev || org.nit || "")
            setCompanyLogo((prev) => prev || org.logoUrl || "")
            setOwnerName((prev) => prev || org.ownerName || "")
            if (!companyPhone && org.phone) {
              setCompanyPhone(org.phone)
            }
          }
        }
      } catch {
        // ignorar errores de organización para no romper la generación del PDF
      }
    }

    loadCurrencyAndTheme()
    loadOrganization()
  }, [customerSlug, open, companyPhone])

  const fetchImageAsDataUrl = useCallback(async (url: string): Promise<string | null> => {
    if (!url) return null
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      const blob = await response.blob()
      return await new Promise<string | null>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('No se pudo cargar la imagen'))
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('No se pudo cargar el logo para el PDF:', error)
      return null
    }
  }, [])

  const formatCurrency = useCallback(
    (value: number) => formatCurrencyWithPreferences(value, customerSlug, currencyCode),
    [currencyCode, customerSlug]
  )

  const customerName = useMemo(() => {
    if (!sale) return "—"
    if (sale.customer) {
      const fullName = `${sale.customer.name ?? ""} ${sale.customer.lastName ?? ""}`.trim()
      return fullName || sale.customer.email || sale.customerName || "Cliente sin registrar"
    }
    return sale.customerName || "Cliente sin registrar"
  }, [sale])

  const items = useMemo(() => sale?.items ?? [], [sale?.items])
  const subtotal = Number(sale?.subtotal ?? 0)
  const discount = Number(sale?.discount ?? 0)
  const total = Number(sale?.total ?? 0)

  const statusToken = sale ? (statusTokens[sale.status] || statusTokens.completed) : statusTokens.completed
  const paymentLabel = sale ? (paymentTokens[sale.paymentMethod] || sale.paymentMethod) : ""

  const handleExportPdf = useCallback(async () => {
    if (!sale) return

    if (shareUrl) {
      handleOpenShareUrl()
      toast.success(t('sales.pdf.openingExisting'))
      return
    }

    try {
      setIsExporting(true)
      setShareUrl(null)

      const themeColorMap: Record<string, { r: number; g: number; b: number }> = {
        green: { r: 26, g: 120, b: 102 },
        blue: { r: 96, g: 165, b: 250 },
        purple: { r: 147, g: 51, b: 234 },
        orange: { r: 249, g: 115, b: 22 },
        red: { r: 220, g: 38, b: 38 },
        pink: { r: 236, g: 72, b: 153 },
        teal: { r: 20, g: 184, b: 166 },
        cyan: { r: 6, g: 182, b: 212 },
        indigo: { r: 99, g: 102, b: 241 },
        yellow: { r: 234, g: 179, b: 8 },
        emerald: { r: 16, g: 185, b: 129 },
        rose: { r: 225, g: 29, b: 72 },
      }

      const primaryColor = themeColorMap[themeColorKey] || themeColorMap.green
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 16

      let cursorY = margin + 6

      const logoDataUrl = companyLogo ? await fetchImageAsDataUrl(companyLogo) : null

      const headerTitleY = margin
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.text('Detalle de Venta', pageWidth / 2, headerTitleY, { align: 'center' })

      const maxLogoHeight = 32
      const logoX = pageWidth - margin - maxLogoHeight
      let contactBlockTop = headerTitleY + 8
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', logoX, headerTitleY - 6, maxLogoHeight, maxLogoHeight, undefined, 'FAST')
        contactBlockTop = headerTitleY - 6 + maxLogoHeight + 6
      }

      const headerLeftX = margin
      let headerLeftY = headerTitleY + 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(30, 30, 30)
      doc.text(companyName || 'Nombre de la empresa', headerLeftX, headerLeftY)
      headerLeftY += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      if (companyNIT) {
        doc.text(`NIT: ${companyNIT}`, headerLeftX, headerLeftY)
        headerLeftY += 5
      }
      if (companyAddress) {
        doc.text(companyAddress, headerLeftX, headerLeftY)
        headerLeftY += 5
      }
      if (companyWebsite) {
        const websiteDisplay = companyWebsite.replace(/^https?:\/\//, "")
        doc.text(`Web: ${websiteDisplay}`, headerLeftX, headerLeftY)
        headerLeftY += 5
      }
      const formattedNow = formatDateTime(new Date())
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.text('Fecha y Hora :', headerLeftX, headerLeftY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(formattedNow, headerLeftX + 30, headerLeftY)
      headerLeftY += 8

      const contactName = ownerName || companyContactName || companyName || '—'
      const contactPhone = companyPhone || companyWhatsappNumber || '—'
      let contactY = contactBlockTop
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.text(contactName, logoX + maxLogoHeight, contactY, { align: 'right' })
      contactY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Contactos: ${contactPhone}`, logoX + maxLogoHeight, contactY, { align: 'right' })
      contactY += 6

      const headerBottom = Math.max(headerLeftY, contactY, headerTitleY + maxLogoHeight) + 4
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.setLineWidth(0.6)
      doc.line(margin, headerBottom, pageWidth - margin, headerBottom)
      cursorY = headerBottom + 6

      const columnGap = 8
      const leftColumnX = margin
      const rightColumnX = pageWidth / 2 + columnGap / 2

      const customerDetails: Array<[string, string]> = [
        ['Cliente', customerName],
        ['Teléfono', sale.customer?.phone || '—'],
        ['Correo', sale.customer?.email || '—'],
      ]

      const saleDetails: Array<[string, string]> = [
        ['Código', sale.saleNumber],
        ['Fecha', sale.createdAt ? formatDateTime(sale.createdAt) : 'Sin fecha'],
        ['Método de Pago', paymentLabel],
      ]

      const drawDetailsColumn = (x: number, title: string, rows: Array<[string, string]>) => {
        let y = cursorY
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
        doc.text(title.toUpperCase(), x, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(45, 45, 45)

        rows.forEach(([label, value]: [string, string]) => {
          doc.text(`${label}:`, x, y)
          const valueX = x + 32
          const width = pageWidth / 2 - columnGap - 38
          const lines = doc.splitTextToSize(value || '—', width) as string[]
          lines.forEach((line: string, idx: number) => {
            doc.text(line, valueX, y + idx * 5)
          })
          y = y + Math.max(lines.length * 5, 6)
        })

        return y
      }

      const leftEnd = drawDetailsColumn(leftColumnX, 'Datos del cliente', customerDetails)
      const rightEnd = drawDetailsColumn(rightColumnX, 'Datos de la venta', saleDetails)
      cursorY = Math.max(leftEnd, rightEnd) + 6

      const tableTop = cursorY + 4
      const tableWidth = pageWidth - margin * 2
      const colProduct = margin + 2
      const colPrice = margin + tableWidth * 0.55
      const colQty = margin + tableWidth * 0.74
      const colSubtotal = margin + tableWidth - 2

      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.roundedRect(margin, tableTop, tableWidth, 9, 3, 3, 'F')
      doc.text('Producto', colProduct, tableTop + 6)
      doc.text(`Precio ${currencyCode}`, colPrice, tableTop + 6)
      doc.text('Cantidad', colQty, tableTop + 6)
      doc.text('Subtotal', colSubtotal, tableTop + 6, { align: 'right' })

      let rowY = tableTop + 11
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(45, 45, 45)

      if (items.length === 0) {
        doc.text('No hay productos registrados en esta venta.', margin + 4, rowY + 4)
        rowY += 14
      } else {
        items.forEach((item, index) => {
          const displayName = item.product?.name || 'Producto sin nombre'
          const descriptionLines = doc.splitTextToSize(displayName, tableWidth * 0.52) as string[]
          const rowHeight = Math.max(descriptionLines.length * 5, 7) + 4

          if (rowY + rowHeight > pageHeight - 40) {
            doc.addPage()
            rowY = margin
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
            doc.setTextColor(255, 255, 255)
            doc.roundedRect(margin, rowY, tableWidth, 9, 3, 3, 'F')
            doc.text('Producto', colProduct, rowY + 6)
            doc.text(`Precio ${currencyCode}`, colPrice, rowY + 6)
            doc.text('Cantidad', colQty, rowY + 6)
            doc.text('Subtotal', colSubtotal, rowY + 6, { align: 'right' })
            rowY += 11
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(45, 45, 45)
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 249, 252)
            doc.rect(margin, rowY - 3, tableWidth, rowHeight, 'F')
          }

          descriptionLines.forEach((line: string, idx: number) => {
            doc.text(line, colProduct, rowY + idx * 5)
          })
          doc.text(formatCurrency(item.unitPrice), colPrice, rowY)
          doc.text(String(item.quantity), colQty, rowY)
          doc.text(formatCurrency(item.subtotal), colSubtotal, rowY, { align: 'right' })

          rowY += rowHeight
        })
      }

      doc.setDrawColor(230, 230, 230)
      const dividerY = tableTop - 4
      doc.line(margin, dividerY, pageWidth - margin, dividerY)
      cursorY = rowY + 12

      const summaryRows: Array<[string, string]> = [
        ['SUB TOTAL', formatCurrency(subtotal)],
        ['DESCUENTO', formatCurrency(discount)],
        ['TOTAL', formatCurrency(total)],
      ]

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.text('Resumen de Totales', pageWidth - margin, cursorY, { align: 'right' })
      cursorY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(45, 45, 45)

      summaryRows.forEach(([label, value]) => {
        doc.text(label, pageWidth - margin - 70, cursorY)
        doc.text(value, pageWidth - margin, cursorY, { align: 'right' })
        cursorY += 6
      })

      // Agregar notas si existen (usar traducción si está disponible)
      const currentLanguage = (() => {
        try {
          const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
          return prefs?.language || 'es';
        } catch {
          return 'es';
        }
      })();
      const notes = getTranslatableText(sale.notes, (sale as any).notesTranslations, currentLanguage);
      if (notes && notes.trim()) {
        cursorY += 8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
        doc.text('NOTAS:', margin, cursorY)
        cursorY += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(45, 45, 45)
        const notesLines = doc.splitTextToSize(notes.trim(), pageWidth - margin * 2 - 4) as string[]
        notesLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + 2, cursorY + idx * 5)
        })
        cursorY += notesLines.length * 5 + 6
      }

      const fileBaseName = sale.id ? `venta-${sale.id}` : `venta-${sale.saleNumber}`

      // Generar Base64 del PDF para enviarlo al servidor y SOLO descargar/abrir cuando termine todo el proceso
      const dataUri = doc.output('datauristring')
      const base64 = dataUri.split(',')[1]

      if (base64) {
        try {
          const response = await fetch(`/api/${customerSlug}/ventas/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: fileBaseName,
              pdfBase64: base64,
            }),
          })

          if (response.ok) {
            const payload = await response.json()
            const relativeUrl = payload?.url as string | undefined
            if (relativeUrl) {
              const absoluteUrl = relativeUrl.startsWith('http')
                ? relativeUrl
                : `${typeof window !== 'undefined' ? window.location.origin : ''}${relativeUrl}`

              // Guardamos la URL para reutilizarla y ABRIMOS el PDF solo cuando el servidor terminó
              setShareUrl(absoluteUrl)

              // Forzamos un pequeño cache-busting para asegurarnos de que se vea la última versión
              const cacheBustedUrl = `${absoluteUrl}${absoluteUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
              if (typeof window !== 'undefined') {
                window.open(cacheBustedUrl, '_blank', 'noopener,noreferrer')
              }

              toast.success(t('sales.pdf.ready'))
            } else {
              // Si el backend no devuelve URL, descargamos el PDF localmente recién ahora
              doc.save(`${fileBaseName}.pdf`)
              toast.success(t('sales.pdf.generated'))
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            toast.error(errorData?.error || t('sales.pdf.downloadError'))
          }
        } catch (uploadError) {
          console.error('Error subiendo PDF de venta:', uploadError)
          toast.error(t('sales.pdf.downloadError'))
        }
      }
    } catch (error) {
      console.error('Error al exportar la venta:', error)
      toast.error(t('sales.pdf.generateError'))
    } finally {
      setIsExporting(false)
    }
  }, [
    sale,
    shareUrl,
    handleOpenShareUrl,
    companyLogo,
    customerSlug,
    subtotal,
    discount,
    total,
    formatCurrency,
    fetchImageAsDataUrl,
    companyName,
    companyAddress,
    companyPhone,
    companyWhatsappNumber,
    companyContactName,
    customerName,
    paymentLabel,
    currencyCode,
    companyNIT,
    companyWebsite,
    ownerName,
    themeColorKey,
    items,
    t
  ])

  const handlePrint = useCallback(async () => {
    if (!sale || typeof window === 'undefined') return
    
    try {
      setIsPrinting(true)
      await generateSalePdfAndPrint(sale, customerSlug)
      toast.success(t('sales.pdf.printSuccess') || 'PDF generado correctamente')
    } catch (error) {
      console.error('Error al imprimir venta:', error)
      toast.error(t('sales.pdf.printError') || 'Error al generar el PDF para imprimir')
    } finally {
      setIsPrinting(false)
    }
  }, [sale, customerSlug, t])

  useEffect(() => {
    if (!open || !sale || shareUrl || typeof window === "undefined") return
    const candidates = [
      sale.id ? `/uploads/sales/${customerSlug}/venta-${sale.id}.pdf` : null,
      sale.saleNumber ? `/uploads/sales/${customerSlug}/venta-${sale.saleNumber}.pdf` : null,
    ].filter(Boolean) as string[]

    const checkExisting = async () => {
      for (const relativeUrl of candidates) {
        try {
          const res = await fetch(relativeUrl, { method: 'HEAD' })
          if (res.ok) {
            const absolute = new URL(relativeUrl, window.location.origin).toString()
            setShareUrl(absolute)
            break
          }
        } catch {
          // ignore
        }
      }
    }

    checkExisting()
  }, [open, sale, customerSlug, shareUrl])

  if (!sale) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-2xl max-w-3xl sm:max-w-4xl h-[85vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <DialogHeader className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-b border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Venta {sale.saleNumber}</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Registrada el {sale.createdAt ? formatDateTime(sale.createdAt) : 'Sin fecha'} · {paymentLabel}
          </DialogDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className={`border ${statusToken.className}`}>
              {statusToken.label}
            </Badge>
            <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-0">
              Total: {formatCurrency(Number(sale?.total || 0))}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <div className="space-y-6">
            <section className="flex flex-row gap-3 sm:gap-6 items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 sm:mb-2">Cliente</h3>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                  {customerName}
                </p>
                {sale.customer?.email && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{sale.customer.email}</p>
                )}
                {sale.customer?.phone && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{sale.customer.phone}</p>
                )}
              </div>
              <div className="flex-1 min-w-0 border-l border-gray-200 dark:border-gray-700 pl-3 sm:pl-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 sm:mb-2">Atendido por</h3>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                  {sale.user?.fullName ?? 'Usuario no asignado'}
                </p>
                {sale.user?.email && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{sale.user.email}</p>
                )}
              </div>
            </section>

            {/* Información de sucursal si el plan tiene más de 1 */}
            {/* Nota: SalesUser no tiene relación directa con Branch, la sucursal se obtiene de otras fuentes si es necesario */}

            <section className="overflow-hidden">
              <header className="px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Detalle de productos</h3>
              </header>

              {/* Vista de cards para móvil */}
              <div className="md:hidden space-y-3 px-4 pb-4">
                {sale.items.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No hay productos registrados en esta venta.
                  </div>
                ) : (
                  sale.items.map((item) => {
                    const displayName = item.product?.name ?? 'Producto eliminado'
                    return (
                      <div
                        key={item.id || `${item.productId}-${item.quantity}`}
                        className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] p-4 space-y-3"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
                          {item.trackingCodes && item.trackingCodes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.trackingCodes.map((code) => (
                                <Badge key={code} variant="secondary" className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-0 text-xs">
                                  #{code}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cantidad</p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio Unit.</p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {formatCurrency(Number(item.unitPrice || 0))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subtotal</p>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {formatCurrency(Number(item.subtotal || 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Vista de tabla para desktop */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-[#2a2a2a]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-[#161616]">
                      <TableHead className="text-gray-600 dark:text-gray-300">Producto</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Cantidad</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Precio</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">
                          No hay productos registrados en esta venta.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sale.items.map((item) => (
                        <TableRow key={item.id || `${item.productId}-${item.quantity}`} className="border-gray-200 dark:border-gray-800">
                          <TableCell className="text-sm text-gray-900 dark:text-white">
                            {item.product?.name ?? 'Producto eliminado'}
                            {item.trackingCodes && item.trackingCodes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.trackingCodes.map((code) => (
                                  <Badge key={code} variant="secondary" className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-0">
                                    #{code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(Number(item.unitPrice || 0))}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-white text-right font-semibold">
                            {formatCurrency(Number(item.subtotal || 0))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Number(sale.subtotal || 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Descuento</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Number(sale.discount || 0))}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white border-t border-dashed border-gray-300 dark:border-gray-700 pt-3">
                <span>Total</span>
                <span>
                  {formatCurrency(Number(sale.total || 0))}
                </span>
              </div>
              {(() => {
                const currentLanguage = (() => {
                  try {
                    const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
                    return prefs?.language || 'es';
                  } catch {
                    return 'es';
                  }
                })();
                const notes = getTranslatableText(sale.notes, (sale as any).notesTranslations, currentLanguage);
                return notes && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <h4 className="font-semibold uppercase tracking-wide text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</h4>
                    <p>{notes}</p>
                  </div>
                );
              })()}
            </section>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-t border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-4">
          <div className="w-full flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="new"
              className="rounded-full w-auto"
              onClick={handleExportPdf}
              disabled={!sale || isExporting}
            >
              {shareUrl ? "Ver PDF" : isExporting ? "Generando..." : "Exportar PDF"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full w-auto"
              onClick={handlePrint}
              disabled={!sale || isPrinting}
            >
              {isPrinting ? "Generando..." : "Imprimir"}
            </Button>
            <Button variant="outline" className="rounded-full w-auto" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
