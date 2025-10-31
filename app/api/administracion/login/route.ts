import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthService } from '@/lib/auth/admin-auth-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    console.log('[ADMIN LOGIN] Intento de login', { email })
    const result = await AdminAuthService.login({ email, password })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Responder OK y dejar que el cliente redirija
    const response = NextResponse.json({ success: true, user: result.user, redirect: '/administracion/dashboard' }, { status: 200 })

    if (result.token) {
      console.log('[ADMIN LOGIN] Seteando cookie admin-auth-token')
      response.cookies.set('admin-auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }
    console.log('[ADMIN LOGIN] Respondiendo 200 con redirect /administracion/dashboard')
    return response

  } catch (error) {
    console.error('Error en login API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

