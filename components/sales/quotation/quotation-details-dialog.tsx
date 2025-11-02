"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import jsPDF from "jspdf"
import { ExternalLink, FileDown, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

const formatDateTime = (date?: string | Date | null) => {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusTokens: Record<string, { label: string; className: string }> = {
  active: {
    label: "Activa",
    className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Vencida",
    className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  converted: {
    label: "Convertida",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  },
  approved: {
    label: "Aprobada",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rechazada",
    className: "bg-gray-200 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
}

const DEFAULT_CURRENCY = "BOB"

interface QuotationDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation?: SalesQuotationWithRelations
  customerSlug: string
}

export function QuotationDetailsDialog({ open, onOpenChange, quotation, customerSlug }: QuotationDetailsDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [companyWhatsappNumber, setCompanyWhatsappNumber] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const [companyContactName, setCompanyContactName] = useState<string>("")
  const [companyEmail, setCompanyEmail] = useState<string>("")
  const [companyPhone, setCompanyPhone] = useState<string>("")
  const [companyAddress, setCompanyAddress] = useState<string>("")
  const [companyWebsite, setCompanyWebsite] = useState<string>("")
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY)
  const [showBranchInfo, setShowBranchInfo] = useState<boolean>(true)

  const statusToken = useMemo(() => {
    if (!quotation) return statusTokens["active"]
    return statusTokens[quotation.status] ?? { label: quotation.status, className: "bg-gray-100 text-gray-700" }
  }, [quotation])

  const formatCurrency = useCallback(
    (value: number) => `${currencyCode} ${Number(value || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`,
    [currencyCode]
  )

  const customerName = useMemo(() => {
    if (!quotation) return "—"
    if (quotation.customer) {
      const fullName = `${quotation.customer.name ?? ""} ${quotation.customer.lastName ?? ""}`.trim()
      return fullName || quotation.customer.email || quotation.customerName || "Cliente sin registrar"
    }
    return quotation.customerName || "Cliente sin registrar"
  }, [quotation])

  const customerPhone = useMemo(() => {
    if (!quotation) return ""
    const base = quotation.customer?.phone || quotation.customerPhone || ""
    const digits = base.replace(/[^0-9]/g, "")
    if (!digits) return ""
    const prefixed = base.startsWith("+") ? base : `+${digits}`
    return prefixed
  }, [quotation])

  const items = quotation?.items ?? []
  const subtotal = Number(quotation?.subtotal ?? 0)
  const discount = Number(quotation?.discount ?? 0)
  const total = Number(quotation?.total ?? 0)

  useEffect(() => {
    if (!open) {
      setShareUrl(null)
    }
  }, [open])

  useEffect(() => {
    setShareUrl(null)
  }, [quotation?.id])

  const handleOpenShareUrl = useCallback(() => {
    if (!shareUrl) return
    if (typeof window !== "undefined") {
      window.open(shareUrl, "_blank", "noopener,noreferrer")
    }
  }, [shareUrl])

  useEffect(() => {
    if (typeof document === "undefined") return
    try {
      const raw = document.cookie
        .split("; ")
        .find((chunk) => chunk.startsWith(`sas-prefs-${customerSlug}=`))
        ?.split("=")[1]
      if (!raw) {
        setCompanyWhatsappNumber("")
        setCompanyName("")
        setCompanyContactName("")
        setCompanyEmail("")
        setCompanyPhone("")
        setCompanyAddress("")
        setCompanyWebsite("")
        setCompanyLogo("")
        setCurrencyCode(DEFAULT_CURRENCY)
        setShowBranchInfo(true)
        return
      }
      const parsed = JSON.parse(decodeURIComponent(raw))
      const value = typeof parsed.whatsappNumber === "string" ? parsed.whatsappNumber : ""
      setCompanyWhatsappNumber(value)
      setCompanyName(typeof parsed.companyName === "string" ? parsed.companyName : "")
      setCompanyContactName(typeof parsed.companyContactName === "string" ? parsed.companyContactName : "")
      setCompanyEmail(typeof parsed.companyEmail === "string" ? parsed.companyEmail : "")
      setCompanyPhone(typeof parsed.companyPhone === "string" ? parsed.companyPhone : "")
      setCompanyAddress(typeof parsed.companyAddress === "string" ? parsed.companyAddress : "")
      setCompanyWebsite(typeof parsed.companyWebsite === "string" ? parsed.companyWebsite : "")
      setCompanyLogo(typeof parsed.companyLogo === "string" ? parsed.companyLogo : "")
      setCurrencyCode(typeof parsed.currency === "string" && parsed.currency.trim() ? parsed.currency : DEFAULT_CURRENCY)
      const branchCount = typeof parsed.branchCount === 'number' ? parsed.branchCount : undefined
      setShowBranchInfo(branchCount === undefined || branchCount > 1)
    } catch {
      setCompanyWhatsappNumber("")
      setCompanyName("")
      setCompanyContactName("")
      setCompanyEmail("")
      setCompanyPhone("")
      setCompanyAddress("")
      setCompanyWebsite("")
      setCompanyLogo("")
      setCurrencyCode(DEFAULT_CURRENCY)
      setShowBranchInfo(true)
    }
  }, [customerSlug, open])
 
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

  const handleExportPdf = useCallback(async () => {
    if (!quotation) return

    if (shareUrl) {
      handleOpenShareUrl()
      toast.success("Abriendo PDF existente")
      return
    }

    try {
      setIsExporting(true)
      setShareUrl(null)

      const getPrimaryColor = (): { r: number; g: number; b: number } => {
        const fallback = { r: 26, g: 120, b: 102 }
        if (typeof window === 'undefined') return fallback

        try {
          const dummy = document.createElement('span')
          dummy.style.position = 'fixed'
          dummy.style.opacity = '0'
          dummy.style.pointerEvents = 'none'
          dummy.style.color = 'var(--primary)'
          document.body.appendChild(dummy)
          const resolved = getComputedStyle(dummy).color
          document.body.removeChild(dummy)

          const rgbMatch = resolved.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
          if (rgbMatch) {
            return {
              r: Number(rgbMatch[1]),
              g: Number(rgbMatch[2]),
              b: Number(rgbMatch[3])
            }
          }
        } catch {}

        return fallback
      }

      const primaryColor = getPrimaryColor()
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
      doc.text('Detalle Cotizacion', pageWidth / 2, headerTitleY, { align: 'center' })
 
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
      if (companyAddress) {
        doc.text(companyAddress, headerLeftX, headerLeftY)
        headerLeftY += 5
      }
      if (companyEmail) {
        doc.text(companyEmail, headerLeftX, headerLeftY)
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

      const contactName = companyContactName || companyName || '—'
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

      const infoLeftX = margin
      const infoRightX = pageWidth / 2 + 6
      const infoLabelColor = primaryColor
      cursorY = headerBottom + 6
      const rightInfoYStart = cursorY
      let rightCursorY = rightInfoYStart
 
      const columnGap = 8
      const leftColumnX = margin
      const rightColumnX = pageWidth / 2 + columnGap / 2

      const customerDetails: Array<[string, string]> = [
        ['Cliente', customerName],
        ['Teléfono', customerPhone || '—'],
        ['Correo', quotation.customer?.email || '—'],
        ['Dirección', quotation.customer?.address || '—'],
        ['Detalle de Cotización', quotation.notes || '—'],
      ]

      const quotationDetails: Array<[string, string]> = [
        ['Código', quotation.quotationNumber],
        ['Emitida', formatDateTime(quotation.createdAt)],
        ['Válido hasta', formatDateTime(quotation.expiresAt)],
      ]
      if (showBranchInfo) {
        quotationDetails.push(['Sucursal', quotation.branch?.name || '—'])
      }

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
          const isDetail = label === 'Detalle de Cotización'
          const valueX = isDetail ? x + 2 : x + 32
          const width = pageWidth / 2 - columnGap - (isDetail ? 8 : 38)
          let startY = isDetail ? y + 5 : y
          const lines = doc.splitTextToSize(value || '—', width) as string[]
          lines.forEach((line: string, idx: number) => {
            doc.text(line, valueX, startY + idx * 5)
          })
          y = Math.max(y + 6, startY + Math.max(lines.length * 5, 6))
        })

        return y
      }

      const leftEnd = drawDetailsColumn(leftColumnX, 'Datos del cliente', customerDetails)
      const rightEnd = drawDetailsColumn(rightColumnX, 'Datos de la cotización', quotationDetails)
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
      doc.text('Nombre', colProduct, tableTop + 6)
      doc.text(`Precio ${currencyCode}`, colPrice, tableTop + 6)
      doc.text('Cantidad (U)', colQty, tableTop + 6)
      doc.text('Subtotal', colSubtotal, tableTop + 6, { align: 'right' })

      let rowY = tableTop + 11
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(45, 45, 45)

      if (items.length === 0) {
        doc.text('No hay productos registrados en esta cotización.', margin + 4, rowY + 4)
        rowY += 14
      } else {
        items.forEach((item, index) => {
          const displayName = item.product?.name || item.productName || 'Producto sin nombre'
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
            doc.text('Nombre', colProduct, rowY + 6)
            doc.text(`Precio ${currencyCode}`, colPrice, rowY + 6)
            doc.text('Cantidad (U)', colQty, rowY + 6)
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
 
      const fileBaseName = quotation.id ? `cotizacion-${quotation.id}` : `cotizacion-${quotation.quotationNumber}`
      doc.save(`${fileBaseName}.pdf`)

      const dataUri = doc.output('datauristring')
      const base64 = dataUri.split(',')[1]

      if (base64) {
        try {
          const response = await fetch(`/api/${customerSlug}/cotizaciones/export`, {
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
              setShareUrl(absoluteUrl)
              toast.success('PDF listo y enlace generado')
            } else {
              toast.success('PDF generado correctamente')
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            toast.error(errorData?.error || 'PDF descargado, pero no se pudo guardar el enlace')
          }
        } catch (uploadError) {
          console.error('Error subiendo PDF de cotización:', uploadError)
          toast.error('PDF descargado, pero no se pudo guardar el enlace')
        }
      }
    } catch (error) {
      console.error('Error al exportar la cotización:', error)
      toast.error('No se pudo generar el PDF')
    } finally {
      setIsExporting(false)
    }
  }, [
    quotation,
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
    companyEmail,
    companyPhone,
    companyWebsite,
    companyWhatsappNumber,
    companyContactName,
    showBranchInfo,
  ])

  useEffect(() => {
    if (!open || !quotation || shareUrl || typeof window === "undefined") return
    const candidates = [
      quotation.id ? `/uploads/quotations/${customerSlug}/cotizacion-${quotation.id}.pdf` : null,
      quotation.quotationNumber ? `/uploads/quotations/${customerSlug}/cotizacion-${quotation.quotationNumber}.pdf` : null,
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
  }, [open, quotation, customerSlug, shareUrl])

  const sanitizedCompanyWhatsapp = useMemo(
    () => companyWhatsappNumber.replace(/[^0-9]/g, ""),
    [companyWhatsappNumber]
  )

  const customerWhatsapp = useMemo(() => {
    return customerPhone.replace(/[^0-9]/g, '')
  }, [customerPhone])
 
  const customerWhatsappLink = useMemo(() => {
    if (!shareUrl || !customerWhatsapp) return null
    const messageParts = [
      `Hola ${customerName || ""}, te comparto la cotización ${quotation?.quotationNumber ?? ""}.`,
      shareUrl,
    ]
    if (sanitizedCompanyWhatsapp) {
      messageParts.push(`Puedes responder a este número: +${sanitizedCompanyWhatsapp}`)
    }
    const message = encodeURIComponent(messageParts.filter(Boolean).join("\n"))
    return `https://wa.me/${customerWhatsapp}?text=${message}`
  }, [shareUrl, customerWhatsapp, sanitizedCompanyWhatsapp, quotation?.quotationNumber, customerName])

  const handleSendWhatsapp = useCallback(() => {
    if (!customerWhatsappLink) {
      if (!customerWhatsapp) {
        toast.error("Agrega un teléfono al cliente para enviar la cotización por WhatsApp")
      } else {
        toast.error("Configura un número de WhatsApp en Configuración")
      }
      return
    }
    if (typeof window !== "undefined") {
      window.open(customerWhatsappLink, "_blank", "noopener,noreferrer")
    }
  }, [customerWhatsapp, customerWhatsappLink])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#111111]/90 backdrop-blur">
          <DialogHeader className="p-0">
            <DialogTitle>Detalles de la cotización</DialogTitle>
            <DialogDescription>
              Visualiza toda la información relacionada a la cotización seleccionada.
            </DialogDescription>
          </DialogHeader>
        </div>

        {quotation ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">Número</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{quotation.quotationNumber}</p>
              </div>
              <Badge className={`${statusToken.className} rounded-full px-4 py-1.5 text-xs font-semibold self-start`}>{statusToken.label}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50/70 dark:bg-[#151515] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Cliente</p>
                <p className="font-semibold text-gray-900 dark:text-white">{customerName}</p>
                {(quotation.customer?.email || quotation.customer?.ruc) && (
                  <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                    {quotation.customer?.email && <span>{quotation.customer.email}</span>}
                    {quotation.customer?.ruc && <span>CI: {quotation.customer.ruc}</span>}
                  </div>
                )}
                <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {customerPhone && <span>Tel: {customerPhone}</span>}
                  {quotation.customer?.address && <span>Dir: {quotation.customer.address}</span>}
                </div>
              </div>
              <div className="grid gap-3 p-4 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Creada:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(quotation.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vencimiento:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(quotation.expiresAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actualizada:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(quotation.updatedAt)}</span>
                </div>
              </div>
            </div>

            {showBranchInfo && quotation.branch && (
              <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] p-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sucursal</p>
                <p className="font-semibold text-gray-900 dark:text-white">{quotation.branch.name ?? 'Sin sucursal'}</p>
                {quotation.branch.address ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{quotation.branch.address}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sin dirección registrada</p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#1f1f1f]">
                    <TableHead className="text-gray-700 dark:text-gray-300">Producto</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[90px]">Cant.</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[120px]">Precio</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[120px] text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No hay productos registrados en esta cotización.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const displayName = item.product?.name || item.productName || "Producto sin nombre"
                      return (
                        <TableRow key={item.id || item.productId || displayName}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                              {item.productId && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">ID: {item.productId}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${Number(item.unitPrice).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                            ${Number(item.subtotal).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 rounded-2xl bg-gray-100 dark:bg-[#252525] px-4 py-3">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Subtotal</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${subtotal.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1 rounded-2xl bg-gray-100 dark:bg-[#252525] px-4 py-3">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Descuento</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${discount.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1 rounded-2xl bg-[color-mix(in_oklch,var(--primary)_15%,white)] dark:bg-[color-mix(in_oklch,var(--primary)_25%,black/60)] px-4 py-3 text-white">
                <p className="text-xs uppercase text-white/80">Total</p>
                <p className="text-lg font-semibold">
                  ${total.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {quotation.notes && (
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Notas</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
                  {quotation.notes}
                </p>
              </div>
            )}

            {shareUrl && (
              <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Enlace para compartir</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="rounded-full text-sm"
                    title={shareUrl}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="new"
                      className="rounded-full"
                      onClick={handleSendWhatsapp}
                      disabled={!customerWhatsappLink}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full"
                      onClick={handleOpenShareUrl}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir
                    </Button>
                  </div>
                </div>
                {!customerWhatsappLink && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Agrega un número de teléfono al cliente para habilitar el envío por WhatsApp.
                  </p>
                )}
                {customerWhatsappLink && !sanitizedCompanyWhatsapp && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Tip: define el número de la empresa en Configuración para incluirlo en el mensaje.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Selecciona una cotización para ver sus detalles.
          </p>
        )}

        <DialogFooter className="border-t border-gray-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#111111]/90 backdrop-blur px-6 py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-center gap-3 sm:space-x-3 sm:space-y-0 space-y-2">
          <Button
            variant="new"
            className="rounded-full"
            onClick={handleExportPdf}
            disabled={!quotation || isExporting}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {shareUrl ? "Ver PDF" : isExporting ? "Generando..." : "Exportar PDF"}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
