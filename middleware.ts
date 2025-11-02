import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders } from '@/lib/utils/security-headers'
// Nota: El middleware (edge) no puede verificar JWT con jsonwebtoken.
// Aquí solo validamos presencia de cookies. La verificación completa ocurre en el servidor.

// Logger simplificado para Edge Runtime (no puede usar Pino)
const edgeLogger = {
  debug: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[MW] ${message}`, data || '')
    }
  },
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Crear respuesta base
  let response = NextResponse.next()

  // Aplicar security headers a todas las respuestas
  response = addSecurityHeaders(response)

  // Rutas estáticas y API - no requieren autenticación del middleware
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return response
  }

  // Admin zone protection
  if (pathname.startsWith('/administracion')) {
    const isLogin = pathname.startsWith('/administracion/login')
    const token = request.cookies.get('admin-auth-token')?.value
    edgeLogger.debug('Admin route check', { pathname, isLogin, hasToken: Boolean(token) })
    if (!token) {
      return isLogin ? NextResponse.next() : NextResponse.redirect(new URL('/administracion/login', request.url))
    }
    // Si ya está autenticado y entra al login, redirigir al dashboard
    if (isLogin) {
      edgeLogger.debug('Admin authenticated user accessing login, redirecting to dashboard')
      return NextResponse.redirect(new URL('/administracion/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // SAS zone protection (any first-level path not excluded)
  const first = pathname.split('/').filter(Boolean)[0]
  const excluded = ['', 'administracion']
  if (first && !excluded.includes(first)) {
    const isLogin = pathname.startsWith(`/${first}/login`)
    const token = request.cookies.get('sas-auth-token')?.value
    if (!token) {
      return isLogin ? NextResponse.next() : NextResponse.redirect(new URL(`/${first}/login`, request.url))
    }
    if (isLogin) {
      return NextResponse.redirect(new URL(`/${first}/dashboard`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
