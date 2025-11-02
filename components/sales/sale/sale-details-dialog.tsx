"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SalesSaleWithRelations } from "./types"
import { formatDateTime } from "@/lib/utils/date"
import jsPDF from "jspdf"
import { FileDown, Printer } from "lucide-react"
import { toast } from "sonner"
import { generateSalePdfAndPrint } from "@/lib/utils/pdf-sale-print"

interface SaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SalesSaleWithRelations | null
  customerSlug: string
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

export function SaleDetailsDialog({ open, onOpenChange, sale, customerSlug }: SaleDetailsDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [companyContactName, setCompanyContactName] = useState<string>("")
  const [companyEmail, setCompanyEmail] = useState<string>("")
  const [companyPhone, setCompanyPhone] = useState<string>("")
  const [companyAddress, setCompanyAddress] = useState<string>("")
  const [companyWebsite, setCompanyWebsite] = useState<string>("")
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [companyWhatsappNumber, setCompanyWhatsappNumber] = useState<string>("")
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY)
  const [showBranchInfo, setShowBranchInfo] = useState<boolean>(true)

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

  const formatCurrency = useCallback(
    (value: number) => `${currencyCode} ${Number(value || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`,
    [currencyCode]
  )

  const customerName = useMemo(() => {
    if (!sale) return "—"
    if (sale.customer) {
      const fullName = `${sale.customer.name ?? ""} ${sale.customer.lastName ?? ""}`.trim()
      return fullName || sale.customer.email || sale.customerName || "Cliente sin registrar"
    }
    return sale.customerName || "Cliente sin registrar"
  }, [sale])

  const items = sale?.items ?? []
  const subtotal = Number(sale?.subtotal ?? 0)
  const discount = Number(sale?.discount ?? 0)
  const total = Number(sale?.total ?? 0)

  const statusToken = sale ? (statusTokens[sale.status] || statusTokens.completed) : null
  const paymentLabel = sale ? (paymentTokens[sale.paymentMethod] || sale.paymentMethod) : ""

  const handleExportPdf = useCallback(async () => {
    if (!sale) return

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
        ['Fecha', formatDateTime(sale.createdAt)],
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

      // Agregar notas si existen
      if (sale.notes && sale.notes.trim()) {
        cursorY += 8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
        doc.text('NOTAS:', margin, cursorY)
        cursorY += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(45, 45, 45)
        const notesLines = doc.splitTextToSize(sale.notes.trim(), pageWidth - margin * 2 - 4) as string[]
        notesLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + 2, cursorY + idx * 5)
        })
        cursorY += notesLines.length * 5 + 6
      }

      const fileBaseName = sale.id ? `venta-${sale.id}` : `venta-${sale.saleNumber}`
      doc.save(`${fileBaseName}.pdf`)

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
          console.error('Error subiendo PDF de venta:', uploadError)
          toast.error('PDF descargado, pero no se pudo guardar el enlace')
        }
      }
    } catch (error) {
      console.error('Error al exportar la venta:', error)
      toast.error('No se pudo generar el PDF')
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
    companyEmail,
    companyPhone,
    companyWebsite,
    companyWhatsappNumber,
    companyContactName,
    showBranchInfo,
    customerName,
    paymentLabel,
    currencyCode,
    items,
  ])

  const handlePrint = useCallback(async () => {
    if (!sale || typeof window === 'undefined') return
    await generateSalePdfAndPrint(sale, customerSlug)
  }, [sale, customerSlug])

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
      <DialogContent className="max-w-3xl sm:max-w-4xl h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Venta {sale.saleNumber}</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Registrada el {sale.createdAt ? formatDateTime(sale.createdAt) : 'Sin fecha'} · {paymentLabel}
          </DialogDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className={`border ${statusToken.className}`}>
              {statusToken.label}
            </Badge>
            <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-0">
              Total: BOB {Number(sale.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cliente</h3>
                <p className="mt-2 text-base font-medium text-gray-900 dark:text-white">
                  {sale.customer
                    ? `${sale.customer.name ?? ''} ${sale.customer.lastName ?? ''}`.trim() || 'Cliente sin registrar'
                    : 'Cliente sin registrar'}
                </p>
                {sale.customer?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sale.customer.email}</p>
                )}
                {sale.customer?.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sale.customer.phone}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Atendido por</h3>
                <p className="mt-2 text-base font-medium text-gray-900 dark:text-white">
                  {sale.user?.fullName ?? 'Usuario no asignado'}
                </p>
                {sale.user?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sale.user.email}</p>
                )}
              </div>
            </section>

            <section className="overflow-hidden">
              <header className="px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Detalle de productos</h3>
              </header>
              <div className="overflow-x-auto">
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
                    {sale.items.map((item) => (
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
                          BOB {Number(item.unitPrice || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-sm text-gray-900 dark:text-white text-right font-semibold">
                          BOB {Number(item.subtotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  BOB {Number(sale.subtotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Descuento</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  BOB {Number(sale.discount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white border-t border-dashed border-gray-300 dark:border-gray-700 pt-3">
                <span>Total</span>
                <span>
                  BOB {Number(sale.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {sale.notes && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <h4 className="font-semibold uppercase tracking-wide text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</h4>
                  <p>{sale.notes}</p>
                </div>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-center gap-3">
          <Button
            variant="new"
            className="rounded-full"
            onClick={handleExportPdf}
            disabled={!sale || isExporting}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {shareUrl ? "Ver PDF" : isExporting ? "Generando..." : "Exportar PDF"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
