import { jsPDF } from 'jspdf'
import { NextRequest, NextResponse } from 'next/server'

import { BillingService } from '@/lib/services/admin/billing-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("Invoice Id")

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Obtener la factura con la información de la organización
    const invoice = await BillingService.getInvoiceById(invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (!invoice.organization) {
      return NextResponse.json(
        { error: 'La factura no tiene una organización asociada' },
        { status: 400 }
      )
    }

    const org = invoice.organization
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const loginUrl = `${baseUrl}/${org.slug}/login`

    // Crear el PDF
    const doc = new jsPDF()

    // Configurar fuente y colores
    const primaryColor = '#10b981' // Verde
    const textColor = '#1f2937' // Gris oscuro
    const lightGray = '#6b7280'

    let yPosition = 20

    // Título principal
    doc.setFontSize(24)
    doc.setTextColor(primaryColor)
    doc.text('Bienvenido!', 105, yPosition, { align: 'center' })

    yPosition += 15

    // Nombre de la organización
    doc.setFontSize(18)
    doc.setTextColor(textColor)
    doc.text(org.razonSocial || org.name, 105, yPosition, { align: 'center' })

    yPosition += 20

    // Línea separadora
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, yPosition, 190, yPosition)

    yPosition += 15

    // Mensaje de bienvenida
    doc.setFontSize(12)
    doc.setTextColor(textColor)
    doc.text('Tu cuenta ha sido activada exitosamente.', 20, yPosition)

    yPosition += 10
    doc.text('A continuación encontrarás tus credenciales de acceso:', 20, yPosition)

    yPosition += 20

    // Credenciales - Email
    doc.setFontSize(11)
    doc.setTextColor(lightGray)
    doc.text('Email:', 20, yPosition)

    doc.setFontSize(12)
    doc.setTextColor(textColor)
    doc.setFont('helvetica', 'bold')
    doc.text((org.owner?.email ?? 'No disponible'), 20, yPosition + 6)
    doc.setFont('helvetica', 'normal')

    yPosition += 20

    // Credenciales - Contraseña
    doc.setFontSize(11)
    doc.setTextColor(lightGray)
    doc.text('Contraseña:', 20, yPosition)

    doc.setFontSize(12)
    doc.setTextColor(textColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Tu número de cédula de identidad (CI)', 20, yPosition + 6)
    doc.setFont('helvetica', 'normal')

    yPosition += 20

    // URL de acceso
    doc.setFontSize(11)
    doc.setTextColor(lightGray)
    doc.text('Accede a tu sistema aquí:', 20, yPosition)

    doc.setFontSize(11)
    doc.setTextColor(primaryColor)
    doc.textWithLink(loginUrl, 20, yPosition + 6, { url: loginUrl })

    yPosition += 25

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(20, yPosition, 190, yPosition)

    yPosition += 15

    // Información de la factura
    doc.setFontSize(10)
    doc.setTextColor(lightGray)
    doc.text(`Factura #${invoice.invoiceNumber}`, 20, yPosition)

    const amount = Number(invoice.total)
    const currency = invoice.currency || 'BOB'
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
    const amountText = currency === 'BOB' ? `${formatted} Bs` : formatted

    doc.text(`Monto: ${amountText}`, 20, yPosition + 6)

    yPosition += 20

    // Nota de seguridad
    doc.setFillColor(255, 243, 205) // Amarillo claro
    doc.roundedRect(20, yPosition, 170, 25, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setTextColor(146, 64, 14) // Naranja oscuro
    doc.setFont('helvetica', 'bold')
    doc.text('IMPORTANTE:', 25, yPosition + 8)
    doc.setFont('helvetica', 'normal')

    doc.setFontSize(9)
    const securityText = 'Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.'
    const splitText = doc.splitTextToSize(securityText, 160)
    doc.text(splitText, 25, yPosition + 15)

    yPosition += 35

    // Pie de página
    doc.setFontSize(9)
    doc.setTextColor(lightGray)
    doc.text('Necesitas ayuda? Estamos aqui para asistirte.', 105, 280, { align: 'center' })

    if (org.phone) {
      doc.text(`Teléfono: ${org.phone}`, 105, 286, { align: 'center' })
    }

    // Generar el PDF como buffer
    const pdfBuffer = doc.output("arraybuffer")

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Credenciales-${org.slug}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF de credenciales:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF de credenciales' },
      { status: 500 }
    )
  }
}
