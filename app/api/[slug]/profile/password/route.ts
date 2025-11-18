import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { PasswordService } from '@/lib/services/password-service'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { prisma } from '@/lib/prisma'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const user = await getCurrentSasUser(request, slug)
    
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

    // Obtener usuario completo con contraseña
    const usuario = await prisma.usuarioSas.findUnique({
      where: { id: user.id },
      select: { id: true, password: true }
    })

    if (!usuario || !usuario.password) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o sin contraseña configurada' },
        { status: 404 }
      )
    }

    // Verificar contraseña actual
    const isValidPassword = await PasswordService.compare(
      currentPassword,
      usuario.password
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      )
    }

    // Cambiar contraseña
    await UsuarioSasService.updateUsuario(user.id, {
      password: newPassword
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return handleApiError(error, createErrorContext(request, { action: 'CHANGE_PASSWORD' }))
  }
}

