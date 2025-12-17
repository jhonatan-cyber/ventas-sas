import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { PERMISSIONS } from '@/lib/config/sas-permissions'
import { getCustomerBySlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

// Función para procesar y convertir imagen a WebP
async function processImageToWebP(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ 
      quality: 85,
      effort: 4
    })
    .toBuffer()
}

// POST - Subir imagen de producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const customer = await getCustomerBySlug(slug)
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar permisos: crear/editar productos
    await requirePermission(request, slug, [PERMISSIONS.PRODUCTOS_CREAR, PERMISSIONS.PRODUCTOS_EDITAR])

    // Intentar obtener archivo desde FormData
    let file: File | null = null
    let remoteUrl: string | null = null

    try {
      const contentType = request.headers.get("Content-type") || ''
      
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        file = formData.get("Image") as File
      } else {
        // Si no es FormData, intentar obtener URL remota desde JSON
        const body = await request.json()
        remoteUrl = body.imageUrl || body.url || null
      }

      // Si hay URL remota, descargarla
      if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
        const imageResponse = await fetch(remoteUrl)
        if (!imageResponse.ok) {
          throw new Error('Error al descargar la imagen')
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        
        // Procesar y convertir a WebP
        const processedBuffer = await processImageToWebP(imageBuffer)
        
        // Crear directorio si no existe (con slug)
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products', slug)
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }
        
        // Generar nombre único para el archivo (siempre WebP)
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 15)
        const fileName = `${customer.id}-${timestamp}-${randomStr}.webp`
        const filePath = join(uploadsDir, fileName)
        
        // Guardar imagen procesada
        await writeFile(filePath, processedBuffer)
        
        const imageUrl = `/uploads/products/${slug}/${fileName}`
        return NextResponse.json({ imageUrl }, { status: 200 })
      }

      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó ninguna imagen' },
          { status: 400 }
        )
      }
    } catch (error: any) {
      if (error.message === 'Error al descargar la imagen') {
        return NextResponse.json(
          { error: 'Error al descargar la imagen remota' },
          { status: 400 }
        )
      }
      throw error
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten imágenes (PNG, JPG, JPEG, GIF, WEBP)' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. El tamaño máximo es 5MB' },
        { status: 400 }
      )
    }

    // Crear directorio si no existe (con slug)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products', slug)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const imageBuffer = Buffer.from(bytes)

    // Procesar y convertir a WebP
    const processedBuffer = await processImageToWebP(imageBuffer)

    // Generar nombre único para el archivo (siempre WebP)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = `${customer.id}-${timestamp}-${randomStr}.webp`
    const filePath = join(uploadsDir, fileName)

    // Guardar imagen procesada
    await writeFile(filePath, processedBuffer)

    // Retornar URL pública de la imagen (con slug)
    const imageUrl = `/uploads/products/${slug}/${fileName}`

    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}

