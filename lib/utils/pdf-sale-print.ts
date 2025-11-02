import jsPDF from "jspdf"

const paymentTokens: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  qr: "QR / Billetera",
}

interface SaleItem {
  product?: { name: string } | null
  quantity: number
  unitPrice: number
  subtotal: number
}

interface SaleCustomer {
  name?: string | null
  lastName?: string | null
  phone?: string | null
  email?: string | null
}

interface SaleData {
  id?: string
  saleNumber: string
  createdAt?: string | null
  customer?: SaleCustomer | null
  customerName?: string | null
  paymentMethod: string
  subtotal: number
  discount: number
  total: number
  notes?: string | null
  items: SaleItem[]
}

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

const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
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
  } catch {
    return null
  }
}

export const generateSalePdfAndPrint = async (saleData: SaleData, customerSlug: string) => {
  if (typeof window === 'undefined') return

  try {
    const raw = document.cookie
      .split("; ")
      .find((chunk) => chunk.startsWith(`sas-prefs-${customerSlug}=`))
      ?.split("=")[1]

    let companyName = ""
    let companyContactName = ""
    let companyEmail = ""
    let companyPhone = ""
    let companyAddress = ""
    let companyLogo = ""
    let companyWhatsappNumber = ""

    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw))
      companyName = typeof parsed.companyName === "string" ? parsed.companyName : ""
      companyContactName = typeof parsed.companyContactName === "string" ? parsed.companyContactName : ""
      companyEmail = typeof parsed.companyEmail === "string" ? parsed.companyEmail : ""
      companyPhone = typeof parsed.companyPhone === "string" ? parsed.companyPhone : ""
      companyAddress = typeof parsed.companyAddress === "string" ? parsed.companyAddress : ""
      companyLogo = typeof parsed.companyLogo === "string" ? parsed.companyLogo : ""
      companyWhatsappNumber = typeof parsed.whatsappNumber === "string" ? parsed.whatsappNumber : ""
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

    const customerName = saleData.customer
      ? `${saleData.customer.name ?? ""} ${saleData.customer.lastName ?? ""}`.trim() || "Cliente sin registrar"
      : saleData.customerName || "Cliente sin registrar"

    const customerDetails: Array<[string, string]> = [
      ['Cliente', customerName],
      ['Teléfono', saleData.customer?.phone || '—'],
      ['Correo', saleData.customer?.email || '—'],
    ]

    const paymentLabel = paymentTokens[saleData.paymentMethod] || saleData.paymentMethod
    const saleDetails: Array<[string, string]> = [
      ['Código', saleData.saleNumber],
      ['Fecha', formatDateTime(saleData.createdAt)],
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
    doc.text('Precio BOB', colPrice, tableTop + 6)
    doc.text('Cantidad', colQty, tableTop + 6)
    doc.text('Subtotal', colSubtotal, tableTop + 6, { align: 'right' })

    let rowY = tableTop + 11
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(45, 45, 45)

    const saleItems = saleData.items || []
    if (saleItems.length === 0) {
      doc.text('No hay productos registrados en esta venta.', margin + 4, rowY + 4)
      rowY += 14
    } else {
      saleItems.forEach((item, index) => {
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
          doc.text('Precio BOB', colPrice, rowY + 6)
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
        doc.text(`BOB ${Number(item.unitPrice || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`, colPrice, rowY)
        doc.text(String(item.quantity), colQty, rowY)
        doc.text(`BOB ${Number(item.subtotal || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`, colSubtotal, rowY, { align: 'right' })

        rowY += rowHeight
      })
    }

    doc.setDrawColor(230, 230, 230)
    const dividerY = tableTop - 4
    doc.line(margin, dividerY, pageWidth - margin, dividerY)
    cursorY = rowY + 12

    const subtotal = Number(saleData.subtotal ?? 0)
    const discount = Number(saleData.discount ?? 0)
    const total = Number(saleData.total ?? 0)

    const summaryRows: Array<[string, string]> = [
      ['SUB TOTAL', `BOB ${Number(subtotal).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`],
      ['DESCUENTO', `BOB ${Number(discount).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`],
      ['TOTAL', `BOB ${Number(total).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`],
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
    if (saleData.notes && saleData.notes.trim()) {
      cursorY += 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
      doc.text('NOTAS:', margin, cursorY)
      cursorY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(45, 45, 45)
      const notesLines = doc.splitTextToSize(saleData.notes.trim(), pageWidth - margin * 2 - 4) as string[]
      notesLines.forEach((line: string, idx: number) => {
        doc.text(line, margin + 2, cursorY + idx * 5)
      })
      cursorY += notesLines.length * 5 + 6
    }

    const blob = doc.output('blob')
    const blobUrl = URL.createObjectURL(blob)
    const printWindow = window.open(blobUrl)
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    }
  } catch (error) {
    console.error('Error al imprimir venta:', error)
  }
}

