import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, message, phone } = body

    // Validar campos requeridos
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }

    // Aquí podrías guardar en la base de datos o enviar email
    // Por ahora solo retornamos éxito
    // En producción, podrías:
    // 1. Guardar en una tabla de contactos
    // 2. Enviar email a tu equipo
    // 3. Integrar con un CRM

    console.log('Nuevo contacto:', { name, email, company, phone, message })

    return NextResponse.json({
      success: true,
      message: 'Mensaje recibido correctamente'
    })
  } catch (error) {
    console.error('Error en contacto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar el mensaje' },
      { status: 500 }
    )
  }
}
