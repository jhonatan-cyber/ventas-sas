"use client"

import jsPDF from "jspdf"
import type { SalesReport, GeneralReport, ProductsReport, ExpensesReport, CustomersReport, CashRegisterReport } from "@/lib/services/sales/reports-service"
import { formatCurrencyWithPreferences, getCurrency } from "./preferences"
import { formatDate } from "./date"

interface CompanyInfo {
  companyName: string
  companyContactName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  companyLogo: string
  currencyCode: string
}

/**
 * Obtiene la información de la empresa desde las cookies
 */
function getCompanyInfo(customerSlug: string): CompanyInfo {
  if (typeof document === "undefined") {
    return {
      companyName: "",
      companyContactName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      companyLogo: "",
      currencyCode: "BOB"
    }
  }

  // Usar función de utilidades para obtener moneda (tiene caché y fallback)
  const currencyCode = getCurrency(customerSlug)

  try {
    const raw = document.cookie
      .split("; ")
      .find((chunk) => chunk.startsWith(`sas-prefs-${customerSlug}=`))
      ?.split("=")[1]

    if (!raw) {
      return {
        companyName: "",
        companyContactName: "",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
        companyLogo: "",
        currencyCode
      }
    }

    const parsed = JSON.parse(decodeURIComponent(raw))
    return {
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "",
      companyContactName: typeof parsed.companyContactName === "string" ? parsed.companyContactName : "",
      companyEmail: typeof parsed.companyEmail === "string" ? parsed.companyEmail : "",
      companyPhone: typeof parsed.companyPhone === "string" ? parsed.companyPhone : "",
      companyAddress: typeof parsed.companyAddress === "string" ? parsed.companyAddress : "",
      companyLogo: typeof parsed.companyLogo === "string" ? parsed.companyLogo : "",
      currencyCode
    }
  } catch {
    return {
      companyName: "",
      companyContactName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      companyLogo: "",
      currencyCode: "BOB"
    }
  }
}

/**
 * Obtiene el color primario del tema
 */
function getPrimaryColor(): { r: number; g: number; b: number } {
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
  } catch { }

  return fallback
}

/**
 * Convierte una URL de imagen a data URL
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Agrega el encabezado común a un PDF
 */
async function addPDFHeader(
  doc: jsPDF,
  title: string,
  companyInfo: CompanyInfo,
  pageWidth: number,
  margin: number
): Promise<number> {
  const primaryColor = getPrimaryColor()
  let cursorY = margin + 6

  const logoDataUrl = companyInfo.companyLogo ? await fetchImageAsDataUrl(companyInfo.companyLogo) : null

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text(title, pageWidth / 2, margin, { align: 'center' })

  const maxLogoHeight = 32
  const logoX = pageWidth - margin - maxLogoHeight
  let contactBlockTop = margin + 8

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', logoX, margin - 6, maxLogoHeight, maxLogoHeight, undefined, 'FAST')
    contactBlockTop = margin - 6 + maxLogoHeight + 6
  }

  // Información de la empresa
  const headerLeftX = margin
  let headerLeftY = margin + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text(companyInfo.companyName || 'Nombre de la empresa', headerLeftX, headerLeftY)
  headerLeftY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  if (companyInfo.companyAddress) {
    doc.text(companyInfo.companyAddress, headerLeftX, headerLeftY)
    headerLeftY += 5
  }
  if (companyInfo.companyEmail) {
    doc.text(companyInfo.companyEmail, headerLeftX, headerLeftY)
    headerLeftY += 5
  }
  if (companyInfo.companyPhone) {
    doc.text(companyInfo.companyPhone, headerLeftX, headerLeftY)
    headerLeftY += 5
  }

  // Fecha de generación
  const formattedNow = new Date().toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text('Fecha y Hora:', headerLeftX, headerLeftY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(formattedNow, headerLeftX + 30, headerLeftY)
  headerLeftY += 8

  cursorY = Math.max(contactBlockTop, headerLeftY) + 10

  return cursorY
}

/**
 * Agrega una línea separadora
 */
function addSeparator(doc: jsPDF, y: number, pageWidth: number, margin: number) {
  // Dibujar línea separadora simple
  // Intentar usar setDrawColor si está disponible
  try {
    const setDrawColor = (doc as any).setDrawColor
    if (setDrawColor && typeof setDrawColor === 'function') {
      setDrawColor(200, 200, 200)
    }
  } catch (e) {
    // Continuar sin color personalizado si hay error
  }
  doc.line(margin, y, pageWidth - margin, y)
}

/**
 * Agrega una tabla simple al PDF
 */
function addTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: string[][],
  pageWidth: number,
  margin: number,
  columnWidths?: number[]
): number {
  const primaryColor = getPrimaryColor()
  let y = startY
  const rowHeight = 7
  const headerHeight = 8

  // Calcular anchos de columna
  const availableWidth = pageWidth - (margin * 2)
  const defaultWidth = availableWidth / headers.length
  const widths = columnWidths || headers.map(() => defaultWidth)

  // Encabezado - usar solo texto y líneas (métodos que sabemos que funcionan)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  
  // Dibujar línea superior del encabezado
  doc.line(margin, y, pageWidth - margin, y)
  y += 2

  let x = margin
  headers.forEach((header, i) => {
    doc.text(header, x + 2, y + 5)
    x += widths[i]
  })

  y += headerHeight

  // Dibujar línea inferior del encabezado
  doc.line(margin, y, pageWidth - margin, y)
  y += 2

  // Filas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)

  rows.forEach((row, rowIndex) => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin + 10
    }

    // Dibujar línea separadora entre filas
    if (rowIndex > 0) {
      doc.line(margin, y - 1, pageWidth - margin, y - 1)
    }

    x = margin
    row.forEach((cell, i) => {
      doc.text(cell || '-', x + 2, y + 5)
      x += widths[i]
    })

    y += rowHeight
  })

  return y + 5
}

/**
 * Exporta el reporte de ventas a PDF
 */
export async function exportSalesReportToPDF(
  report: SalesReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte de Ventas', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen General', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summary = [
    `Total de Ventas: ${report.totalSales}`,
    `Ingresos Totales: ${formatCurrencyWithPreferences(report.totalRevenue, customerSlug, companyInfo.currencyCode)}`,
    `Ventas Anuladas: ${report.byStatus.cancelled.count}`,
    `Ingreso Neto: ${formatCurrencyWithPreferences(report.netRevenue, customerSlug, companyInfo.currencyCode)}`
  ]

  summary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Productos más vendidos
  if (report.topProducts.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Productos Más Vendidos', margin, cursorY)
    cursorY += 8

    const productRows = report.topProducts.map(p => [
      p.productName,
      p.quantitySold.toString(),
      formatCurrencyWithPreferences(p.revenue, customerSlug, companyInfo.currencyCode)
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Producto', 'Cantidad', 'Ingresos'],
      productRows,
      pageWidth,
      margin,
      [80, 30, 40]
    )
    cursorY += 5
  }

  // Clientes principales
  if (report.topCustomers.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    addSeparator(doc, cursorY, pageWidth, margin)
    cursorY += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Clientes Principales', margin, cursorY)
    cursorY += 8

    const customerRows = report.topCustomers.map(c => [
      c.customerName,
      c.totalPurchases.toString(),
      formatCurrencyWithPreferences(c.totalSpent, customerSlug, companyInfo.currencyCode)
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Cliente', 'Compras', 'Total Gastado'],
      customerRows,
      pageWidth,
      margin,
      [70, 30, 50]
    )
  }

  // Ventas por método de pago
  if (cursorY > pageHeight - 60) {
    doc.addPage()
    cursorY = margin + 10
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Ventas por Método de Pago', margin, cursorY)
  cursorY += 8

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    qr: 'QR / Billetera'
  }

    const paymentRows = Object.entries(report.byPaymentMethod)
      .filter(([_, data]) => data.count > 0)
      .map(([method, data]) => [
        paymentLabels[method] || method,
        data.count.toString(),
        formatCurrencyWithPreferences(data.amount, customerSlug, companyInfo.currencyCode)
      ])

    if (paymentRows.length > 0) {
      cursorY = addTable(
        doc,
        cursorY,
        ['Método', 'Cantidad', 'Monto'],
        paymentRows,
        pageWidth,
        margin,
        [50, 30, 50]
      )
    }

  doc.save(`reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta el reporte general a PDF
 */
export async function exportGeneralReportToPDF(
  report: GeneralReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte General', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen financiero
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen Financiero', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const financialSummary = [
    `Ingresos Totales: ${formatCurrencyWithPreferences(report.totalRevenue, customerSlug, companyInfo.currencyCode)}`,
    `Gastos Totales: ${formatCurrencyWithPreferences(report.totalExpenses, customerSlug, companyInfo.currencyCode)}`,
    `Utilidad Neta: ${formatCurrencyWithPreferences(report.netProfit, customerSlug, companyInfo.currencyCode)}`,
    `Margen de Utilidad: ${report.profitMargin.toFixed(2)}%`
  ]

  financialSummary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen operacional
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Resumen Operacional', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const operationalSummary = [
    `Ventas: ${report.salesCount}`,
    `Gastos: ${report.expensesCount}`,
    `Cotizaciones: ${report.quotationsCount}`,
    `Productos: ${report.productsCount}`,
    `Clientes: ${report.customersCount}`
  ]

  operationalSummary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  doc.save(`reporte-general-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta el reporte de productos a PDF
 */
export async function exportProductsReportToPDF(
  report: ProductsReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte de Productos', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen de Inventario', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summary = [
    `Total de Productos: ${report.totalProducts}`,
    `Productos Activos: ${report.activeProducts}`,
    `Productos Inactivos: ${report.inactiveProducts}`,
    `Stock Bajo: ${report.lowStockProducts}`,
    `Sin Stock: ${report.outOfStockProducts}`,
    `Valor del Inventario: ${formatCurrencyWithPreferences(report.totalStockValue, customerSlug, companyInfo.currencyCode)}`
  ]

  summary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Productos más vendidos
  if (report.topSelling.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Productos Más Vendidos', margin, cursorY)
    cursorY += 8

    const productRows = report.topSelling.map(p => [
      p.productName,
      p.quantitySold.toString(),
      formatCurrencyWithPreferences(p.revenue, customerSlug, companyInfo.currencyCode)
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Producto', 'Cantidad', 'Ingresos'],
      productRows,
      pageWidth,
      margin,
      [80, 30, 40]
    )
    cursorY += 5
  }

  // Productos por categoría
  if (report.byCategory.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    addSeparator(doc, cursorY, pageWidth, margin)
    cursorY += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Productos por Categoría', margin, cursorY)
    cursorY += 8

    const categoryRows = report.byCategory.map(c => [
      c.categoryName,
      c.productCount.toString()
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Categoría', 'Cantidad'],
      categoryRows,
      pageWidth,
      margin,
      [100, 50]
    )
  }

  doc.save(`reporte-productos-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta el reporte de gastos a PDF
 */
export async function exportExpensesReportToPDF(
  report: ExpensesReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte de Gastos', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summary = [
    `Total de Gastos: ${report.totalExpenses}`,
    `Monto Total: ${formatCurrencyWithPreferences(report.totalAmount, customerSlug, companyInfo.currencyCode)}`
  ]

  summary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Gastos por categoría
  if (report.byCategory.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Gastos por Categoría', margin, cursorY)
    cursorY += 8

    const categoryRows = report.byCategory.map(c => [
      c.category,
      c.count.toString(),
      formatCurrencyWithPreferences(c.amount, customerSlug, companyInfo.currencyCode)
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Categoría', 'Cantidad', 'Monto Total'],
      categoryRows,
      pageWidth,
      margin,
      [70, 30, 50]
    )
  }

  doc.save(`reporte-gastos-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta el reporte de clientes a PDF
 */
export async function exportCustomersReportToPDF(
  report: CustomersReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte de Clientes', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summary = [
    `Total de Clientes: ${report.totalCustomers}`,
    `Clientes Activos: ${report.activeCustomers}`,
    `Con Compras: ${report.withPurchases}`,
    `Sin Compras: ${report.withoutPurchases}`
  ]

  summary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Clientes principales
  if (report.topCustomers.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Clientes Principales', margin, cursorY)
    cursorY += 8

    const customerRows = report.topCustomers.map(c => [
      c.customerName,
      c.totalPurchases.toString(),
      formatCurrencyWithPreferences(c.totalSpent, customerSlug, companyInfo.currencyCode),
      c.lastPurchaseDate ? formatDate(c.lastPurchaseDate.toString()) : 'N/A'
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Cliente', 'Compras', 'Total Gastado', 'Última Compra'],
      customerRows,
      pageWidth,
      margin,
      [50, 25, 40, 35]
    )
    cursorY += 5
  }

  // Clientes por cantidad de compras
  if (report.byPurchaseCount.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    addSeparator(doc, cursorY, pageWidth, margin)
    cursorY += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Clientes por Cantidad de Compras', margin, cursorY)
    cursorY += 8

    const purchaseCountRows = report.byPurchaseCount.map(r => [
      r.range,
      r.count.toString()
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Rango de Compras', 'Cantidad de Clientes'],
      purchaseCountRows,
      pageWidth,
      margin,
      [100, 50]
    )
  }

  doc.save(`reporte-clientes-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta el reporte de cajas a PDF
 */
export async function exportCashRegistersReportToPDF(
  report: CashRegisterReport,
  customerSlug: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const companyInfo = getCompanyInfo(customerSlug)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  let cursorY = await addPDFHeader(doc, 'Reporte de Cajas', companyInfo, pageWidth, margin)

  // Rango de fechas
  if (startDate || endDate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const dateRange = `Período: ${startDate ? formatDate(startDate) : 'Inicio'} - ${endDate ? formatDate(endDate) : 'Fin'}`
    doc.text(dateRange, margin, cursorY)
    cursorY += 8
  }

  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Resumen
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen', margin, cursorY)
  cursorY += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summary = [
    `Total de Cajas: ${report.totalCashRegisters}`,
    `Cajas Abiertas: ${report.openCashRegisters}`,
    `Cajas Cerradas: ${report.closedCashRegisters}`,
    `Balance Total: ${formatCurrencyWithPreferences(report.totalBalance, customerSlug, companyInfo.currencyCode)}`,
    `Total Aperturas: ${report.totalOpenings}`,
    `Total Cierres: ${report.totalClosings}`
  ]

  summary.forEach(line => {
    doc.text(line, margin + 5, cursorY)
    cursorY += 6
  })

  cursorY += 5
  addSeparator(doc, cursorY, pageWidth, margin)
  cursorY += 10

  // Cajas por sucursal
  if (report.byBranch.length > 0) {
    if (cursorY > pageHeight - 60) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Cajas por Sucursal', margin, cursorY)
    cursorY += 8

    const branchRows = report.byBranch.map(b => [
      b.branchName,
      b.cashRegisterCount.toString()
    ])

    cursorY = addTable(
      doc,
      cursorY,
      ['Sucursal', 'Cantidad de Cajas'],
      branchRows,
      pageWidth,
      margin,
      [100, 50]
    )
  }

  doc.save(`reporte-cajas-${new Date().toISOString().split('T')[0]}.pdf`)
}

