import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Nota: El middleware (edge) no puede verificar JWT con jsonwebtoken.
// Aquí solo validamos presencia de cookies. La verificación completa ocurre en el servidor.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Admin zone protection
  if (pathname.startsWith('/administracion')) {
    const isLogin = pathname.startsWith('/administracion/login')
    const token = request.cookies.get('admin-auth-token')?.value
    console.log('[MW][ADMIN]', { pathname, isLogin, hasToken: Boolean(token) })
    if (!token) {
      return isLogin ? NextResponse.next() : NextResponse.redirect(new URL('/administracion/login', request.url))
    }
    // Si ya está autenticado y entra al login, redirigir al dashboard
    if (isLogin) {
      console.log('[MW][ADMIN] autenticado y en login, redirigiendo a /administracion/dashboard')
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
