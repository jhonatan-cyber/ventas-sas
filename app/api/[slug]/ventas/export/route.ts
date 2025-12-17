import { existsSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { NextRequest, NextResponse } from "next/server"

import { PERMISSIONS } from '@/lib/config/sas-permissions'
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { getCustomerBySlug } from "@/lib/utils/organization"
import requirePermission from '@/lib/utils/require-permission'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Leer body (una sola vez)
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Error al procesar el cuerpo de la solicitud" }, { status: 400 })
    }

    const pdfBase64 = typeof body?.pdfBase64 === "string" ? body.pdfBase64.trim() : ""
    const fileNameRaw = typeof body?.fileName === "string" ? body.fileName : ""

    if (!pdfBase64) {
      return NextResponse.json({ error: "Archivo PDF no proporcionado" }, { status: 400 })
    }

    // Validar cliente
    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Autenticación
    const token = request.cookies.get("sas-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado. Token de autenticación no encontrado." }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = await AuthSasService.verifyToken(slug, token)
    } catch (error) {
      console.error("Error verificando token:", error)
      return NextResponse.json({ error: "No autorizado. Error al verificar el token." }, { status: 401 })
    }

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado. Token inválido o expirado." }, { status: 401 })
    }

    // Verificar permiso para exportar ventas
    await requirePermission(request, slug, PERMISSIONS.VENTAS_CREAR)

    const safeName = fileNameRaw.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 80) || `venta-${Date.now()}`
    const buffer = Buffer.from(pdfBase64, "base64")

    const uploadsDir = join(process.cwd(), "public", "uploads", "sales", slug)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const finalName = `${safeName}.pdf`
    const filePath = join(uploadsDir, finalName)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/sales/${slug}/${finalName}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Error guardando PDF de venta:", error)
    return NextResponse.json({ error: "No se pudo guardar el PDF" }, { status: 500 })
  }
}

