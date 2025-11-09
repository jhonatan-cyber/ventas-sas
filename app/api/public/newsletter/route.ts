import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validar email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Aquí podrías:
    // 1. Guardar en base de datos
    // 2. Integrar con servicio de email marketing (Mailchimp, SendGrid, etc.)
    // 3. Enviar email de confirmación

    console.log('Nuevo suscriptor newsletter:', email)

    return NextResponse.json({
      success: true,
      message: 'Te has suscrito correctamente'
    })
  } catch (error) {
    console.error('Error en newsletter:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la suscripción' },
      { status: 500 }
    )
  }
}

