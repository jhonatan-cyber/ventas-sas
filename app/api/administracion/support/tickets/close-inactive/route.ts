import { NextRequest, NextResponse } from 'next/server'

import { SupportService } from '@/lib/services/admin/support-service'

/**
 * Endpoint para cerrar automáticamente tickets inactivos por más de 24 horas
 * Este endpoint puede ser llamado por un cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que la solicitud viene de un origen autorizado (opcional, para seguridad)
    const authHeader = request.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const result = await SupportService.closeInactiveTickets()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error al cerrar tickets inactivos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// También permitir GET para facilitar pruebas y configuración de cron jobs
export async function GET(request: NextRequest) {
  return POST(request)
}

