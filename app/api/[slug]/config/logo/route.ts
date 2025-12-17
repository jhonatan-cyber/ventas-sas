import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { PERMISSIONS } from '@/lib/config/sas-permissions'
import { prisma } from '@/lib/prisma'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  try {
    const { slug } = await params
    console.log('\n' + '='.repeat(60))
    console.log('📤 [LOGO UPLOAD] Iniciando subida de logo')
    console.log('📤 [LOGO UPLOAD] Slug:', slug)
    console.log('📤 [LOGO UPLOAD] Timestamp:', new Date().toISOString())

    // Verificar autenticación primero
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      console.error('❌ Usuario no autenticado para slug:', slug)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.log('✅ Usuario autenticado:', currentUser.id)

    // Verificar permiso para modificar configuración (logo)
    await requirePermission(request, slug, PERMISSIONS.MANAGE_ALL)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      console.error('❌ Organización no encontrada para slug:', slug)
      return NextResponse.json({ error: 'Organización no encontrada o inactiva' }, { status: 404 })
    }
    console.log('✅ Organización encontrada:', organizationId)

    // Obtener archivo desde FormData (como en productos)
    const formData = await request.formData()
    const file = formData.get("Logo") as File | null

    if (!file) {
      console.error('❌ No se proporcionó ningún archivo')
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    console.log('✅ [LOGO UPLOAD] Archivo recibido:')
    console.log('   - Nombre:', file.name)
    console.log('   - Tipo:', file.type)
    console.log('   - Tamaño:', file.size, 'bytes (', (file.size / 1024).toFixed(2), 'KB)')

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      console.error('❌ Tipo de archivo no válido:', file.type)
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Solo se permiten imágenes (PNG, JPG, JPEG, GIF, WEBP, SVG)' 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('❌ Archivo demasiado grande:', file.size, 'bytes')
      return NextResponse.json({ 
        error: 'La imagen es demasiado grande. El tamaño máximo es 5MB' 
      }, { status: 400 })
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'El archivo proporcionado está vacío' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'config', slug)
    console.log('📁 Directorio de uploads:', uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      console.log('📁 Creando directorio:', uploadsDir)
      await mkdir(uploadsDir, { recursive: true })
      console.log('✅ Directorio creado')
    } else {
      console.log('✅ Directorio ya existe')
    }

    // Obtener el logo anterior de la BD para eliminarlo después
    let oldLogoPath: string | null = null
    let oldLogoUrl: string | null = null
    try {
      // Buscar logo anterior en WhiteLabelBranding (fuente principal)
      const { WhiteLabelService } = await import("@/lib/services/admin/white-label-service")
      const branding = await WhiteLabelService.getBranding(organizationId)
      if (branding?.logoUrl) {
        oldLogoUrl = branding.logoUrl as string
      } else {
        // Fallback: buscar en settings de la organización
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { settings: true }
        })
        const currentSettings = (organization?.settings as Record<string, any>) || {}
        if (currentSettings.logoUrl) {
          oldLogoUrl = currentSettings.logoUrl as string
        }
      }
      
      // Si hay un logo anterior, obtener la ruta del archivo
      if (oldLogoUrl && oldLogoUrl.startsWith('/uploads/config/')) {
        const oldFileName = oldLogoUrl.split("/").pop()
        if (oldFileName) {
          oldLogoPath = join(uploadsDir, oldFileName)
          console.log('📋 Logo anterior encontrado:', oldLogoUrl)
          console.log('📋 Ruta del archivo anterior:', oldLogoPath)
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el logo anterior:', error)
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    
    // Manejar SVG de forma especial (no se procesa con Sharp)
    const isSvg = file.type === 'image/svg+xml'
    let fileName: string
    let filePath: string
    let processed: Buffer

    if (isSvg) {
      // Para SVG, guardar directamente sin procesar con nombre único
      fileName = `logo-${organizationId}-${timestamp}-${randomStr}.svg`
      filePath = join(uploadsDir, fileName)
      processed = buffer
      console.log('🖼️ Guardando SVG directamente sin procesar...')
    } else {
      // Para otras imágenes, procesar con Sharp y generar nombre único
      fileName = `logo-${organizationId}-${timestamp}-${randomStr}.webp`
      filePath = join(uploadsDir, fileName)
      console.log('🖼️ Procesando imagen con Sharp...')
      try {
        processed = await sharp(buffer)
          .resize({ width: 480, height: 480, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toFormat('webp', { quality: 90 })
          .toBuffer()
        console.log('✅ Imagen procesada, tamaño:', processed.length, 'bytes')
      } catch (sharpError) {
        console.error('❌ Error procesando imagen con Sharp:', sharpError)
        return NextResponse.json({ 
          error: 'Error al procesar la imagen. Asegúrate de que el archivo sea una imagen válida.' 
        }, { status: 400 })
      }
    }

    console.log('💾 Guardando archivo en:', filePath)
    await writeFile(filePath, processed)
    console.log('✅ Archivo escrito en disco')

    // Verificar que el archivo se guardó correctamente
    if (!existsSync(filePath)) {
      console.error('El archivo no se guardó correctamente en:', filePath)
      return NextResponse.json({ error: 'No se pudo guardar el archivo' }, { status: 500 })
    }

    const publicUrl = `/uploads/config/${slug}/${fileName}`
    console.log('✅ [LOGO UPLOAD] Archivo guardado en disco:')
    console.log('   - Ruta completa:', filePath)
    console.log('   - URL pública:', publicUrl)
    console.log('   - Tamaño final:', processed.length, 'bytes')

    // Guardar la URL del logo en la base de datos (en el campo settings de Organization)
    console.log('💾 [LOGO UPLOAD] Guardando URL en base de datos...')
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true }
      })

      const currentSettings = (organization?.settings as Record<string, any>) || {}
      const updatedSettings = {
        ...currentSettings,
        logoUrl: publicUrl
      }

      console.log('📝 Settings actuales:', JSON.stringify(currentSettings))
      console.log('📝 Settings actualizados:', JSON.stringify(updatedSettings))

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          settings: updatedSettings
        }
      })

      console.log('✅ [LOGO UPLOAD] URL guardada en BD:', publicUrl)
      
      // Eliminar el logo anterior ANTES de actualizar WhiteLabelBranding
      if (oldLogoPath && oldLogoPath !== filePath && existsSync(oldLogoPath)) {
        try {
          const { unlink } = await import("fs/promises")
          await unlink(oldLogoPath)
          console.log('🗑️ Logo anterior eliminado del sistema de archivos:', oldLogoPath)
        } catch (deleteError) {
          console.warn('⚠️ No se pudo eliminar el logo anterior del sistema de archivos:', deleteError)
          // No fallar si no se puede eliminar el archivo anterior
        }
      } else if (oldLogoPath) {
        console.log('ℹ️ Logo anterior no encontrado en el sistema de archivos o es el mismo archivo')
      }
    } catch (dbError) {
      console.error('❌ Error guardando URL del logo en la base de datos:', dbError)
      // Si falla el guardado en BD, eliminar el archivo recién creado
      try {
        const { unlink } = await import("fs/promises")
        await unlink(filePath)
        console.log('🗑️ Archivo eliminado debido a error en BD')
      } catch (deleteError) {
        console.warn('⚠️ No se pudo eliminar el archivo después del error:', deleteError)
      }
      return NextResponse.json({ 
        error: 'Error al guardar el logo en la base de datos' 
      }, { status: 500 })
    }

    // Actualizar WhiteLabelBranding con el nuevo logo
    try {
      const { WhiteLabelService } = await import("@/lib/services/admin/white-label-service")
      await WhiteLabelService.updateBranding(organizationId, {
        logoUrl: publicUrl,
      })
      console.log('✅ Logo guardado en WhiteLabelBranding')
    } catch (brandingError) {
      console.warn('⚠️ No se pudo actualizar WhiteLabelBranding:', brandingError)
      // Continuar aunque falle, el logo ya está guardado en settings
    }

    const elapsed = Date.now() - startTime
    console.log('✅ [LOGO UPLOAD] Proceso completado en', elapsed, 'ms')
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({ 
      success: true,
      logoUrl: publicUrl,
      url: publicUrl 
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('❌ [LOGO UPLOAD] Error después de', elapsed, 'ms:', error)
    console.error('❌ [LOGO UPLOAD] Stack:', error instanceof Error ? error.stack : 'N/A')
    console.log('='.repeat(60) + '\n')
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'No se pudo guardar el logo' 
    }, { status: 500 })
  }
}

