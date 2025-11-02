import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json().catch(() => null)

    if (!body || typeof body.logoBase64 !== 'string' || body.logoBase64.trim().length === 0) {
      return NextResponse.json({ error: 'Logo inválido' }, { status: 400 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Cliente no encontrado o inactivo' }, { status: 404 })
    }

    const base64Data = body.logoBase64.trim()
    let buffer: Buffer
    try {
      buffer = Buffer.from(base64Data, 'base64')
    } catch {
      return NextResponse.json({ error: 'El archivo proporcionado no es válido' }, { status: 400 })
    }

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'El archivo proporcionado está vacío' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'config', slug)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const fileName = 'logo.webp'
    const filePath = join(uploadsDir, fileName)

    const processed = await sharp(buffer)
      .resize({ width: 480, height: 480, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFormat('webp', { quality: 90 })
      .toBuffer()

    await writeFile(filePath, processed)

    const publicUrl = `/uploads/config/${slug}/${fileName}?v=${Date.now()}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error al guardar el logo de configuración:', error)
    return NextResponse.json({ error: 'No se pudo guardar el logo' }, { status: 500 })
  }
}

