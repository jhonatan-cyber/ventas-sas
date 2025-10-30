import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import { JWTService } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const result = await AuthService.login({ email, password })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Crear cookie de autenticación con nombre auth_session
    const response = NextResponse.json(
      { 
        success: true, 
        user: result.user 
      },
      { status: 200 }
    )

    if (result.token) {
      response.cookies.set('auth_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }

    return response

  } catch (error) {
    console.error('Error en login API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

