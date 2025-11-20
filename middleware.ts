import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { addSecurityHeaders } from '@/lib/utils/security-headers'
// Nota: El middleware (edge) no puede verificar JWT con jsonwebtoken.
// Aquí solo validamos presencia de cookies. La verificación completa ocurre en el servidor.

// Logger simplificado para Edge Runtime (no puede usar Pino)
const edgeLogger = {
  debug: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
       
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
  const response = addSecurityHeaders(NextResponse.next())

  // Admin zone protection
  if (pathname.startsWith('/administracion')) {
    const isLogin = pathname.startsWith('/administracion/login')
    const token = request.cookies.get('admin-auth-token')?.value
    edgeLogger.debug('Admin route check', { pathname, isLogin, hasToken: Boolean(token) })
    
    // Permitir siempre el acceso a login (evitar bucles de redirección)
    // El dashboard se encargará de validar el token y redirigir si es inválido
    if (isLogin) {
      return response
    }
    
    // Para otras rutas de admin, verificar token
    if (!token) {
      return NextResponse.redirect(new URL('/administracion/login', request.url))
    }
    
    return response
  }

  // Rutas públicas - no requieren autenticación
  const publicRoutes = ['privacidad', 'terminos', 'cookies', 'doc', 'offline']
  const first = pathname.split('/').filter(Boolean)[0]
  
  // Permitir acceso a la ruta raíz (página principal)
  if (pathname === '/') {
    return NextResponse.next()
  }
  
  // Permitir acceso a rutas públicas
  if (first && publicRoutes.includes(first)) {
    return NextResponse.next()
  }

  // SAS zone protection (any first-level path not excluded)
  const excluded = ['', 'administracion']
  if (first && !excluded.includes(first)) {
    const isLogin = pathname.startsWith(`/${first}/login`)
    const isResetPassword = pathname.startsWith(`/${first}/reset-password`)
    const hasAuthToken = Boolean(request.cookies.get('sas-auth-token')?.value)
    const hasSession = Boolean(request.cookies.get('sas-session')?.value)
    // Permitir acceso a login y reset-password sin autenticación
    if (isLogin || isResetPassword) {
      return NextResponse.next()
    }
    if (!hasAuthToken && !hasSession) {
      return NextResponse.redirect(new URL(`/${first}/login`, request.url))
    }
    // Permitir acceder a la página de login aunque exista token
    // para evitar bucles cuando falte o sea inválida la sas-session
    return NextResponse.next()
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
