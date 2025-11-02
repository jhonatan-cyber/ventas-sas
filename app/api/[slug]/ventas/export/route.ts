import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const token = request.cookies.get("sas-auth-token")?.value
    const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const pdfBase64 = typeof body?.pdfBase64 === "string" ? body.pdfBase64.trim() : ""
    const fileNameRaw = typeof body?.fileName === "string" ? body.fileName : ""

    if (!pdfBase64) {
      return NextResponse.json({ error: "Archivo PDF no proporcionado" }, { status: 400 })
    }

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

