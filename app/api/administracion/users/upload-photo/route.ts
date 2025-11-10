import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPEG, PNG o WebP' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'users')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${randomString}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Convertir File a Buffer y guardar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar la URL relativa
    const photoUrl = `/uploads/users/${fileName}`

    return NextResponse.json({ 
      success: true, 
      photoUrl 
    })
  } catch (error) {
    console.error('Error subiendo foto:', error)
    return NextResponse.json(
      { error: 'Error al subir la foto' },
      { status: 500 }
    )
  }
}

