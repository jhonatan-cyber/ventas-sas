import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthService } from '@/lib/auth/auth-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validation = changePasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Cambiar contraseña usando AuthService
    const result = await AuthService.changePassword(user.id, currentPassword, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al cambiar la contraseña' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

