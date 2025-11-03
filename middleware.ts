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

  // Rutas estáticas y API - no requieren autenticación del middleware
  // Excluir archivos estáticos del Service Worker y manifest
  // IMPORTANTE: Debe estar ANTES de aplicar security headers para evitar redirects
  const isStaticFile = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/uploads/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|json|js|woff|woff2|ttf|eot)$/i)

  if (isStaticFile) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Crear respuesta base y aplicar security headers a rutas dinámicas
  let response = NextResponse.next()
  response = addSecurityHeaders(response)

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
    /*
     * Match all request paths except for:
     * - api routes
     * - _next static files
     * - static file extensions (handled in middleware logic)
     */
    '/((?!api|_next).*)',
  ],
}
