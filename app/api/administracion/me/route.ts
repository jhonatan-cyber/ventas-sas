import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { AuthService } from '@/lib/services/auth-service'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener información completa del usuario
    const profile = await AuthService.getProfileById(user.id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Retornar información del usuario
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName || 'Usuario',
      role: profile.role,
      isSuperAdmin: profile.isSuperAdmin,
      isActive: profile.isActive,
      photo: profile.photo || null
    })
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

