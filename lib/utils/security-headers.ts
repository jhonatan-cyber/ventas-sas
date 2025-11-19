/**
 * Security Headers Utility
 * 
 * Configura headers de seguridad recomendados por OWASP
 */

import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

interface SecurityHeadersConfig {
  enableCSP?: boolean
  enableHSTS?: boolean
  enableXFrameOptions?: boolean
  enableXContentTypeOptions?: boolean
  enableReferrerPolicy?: boolean
  enablePermissionsPolicy?: boolean
}

/**
 * Agrega headers de seguridad a la respuesta
 */
export function addSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
  } = config

  // Content Security Policy (CSP)
  // Previene XSS y otros ataques de inyección
  if (enableCSP) {
    // CSP para producción (más estricto)
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live", // unsafe-eval para Next.js
      "style-src 'self' 'unsafe-inline'", // unsafe-inline necesario para estilos inline de componentes
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://r2cdn.perplexity.ai",
      "connect-src 'self' https://vercel.live https://*.vercel-insights.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    response.headers.set('Content-Security-Policy', cspDirectives)

    // Report-Only mode para desarrollo (opcional)
    if (process.env.NODE_ENV === 'development' && process.env.CSP_REPORT_ONLY === 'true') {
      response.headers.set('Content-Security-Policy-Report-Only', cspDirectives)
    }
  }

  // HTTP Strict Transport Security (HSTS)
  // Fuerza conexiones HTTPS
  if (enableHSTS && process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-Frame-Options
  // Previene clickjacking
  if (enableXFrameOptions) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  // X-Content-Type-Options
  // Previene MIME type sniffing
  if (enableXContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer-Policy
  // Controla qué información de referrer se envía
  if (enableReferrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Permissions-Policy (antes Feature-Policy)
  // Controla qué features del navegador se pueden usar
  if (enablePermissionsPolicy) {
    const permissions = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=(self)',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ].join(', ')

    response.headers.set('Permissions-Policy', permissions)
  }

  // X-XSS-Protection (deprecated pero aún útil para navegadores antiguos)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Origin Policy
  response.headers.set('Origin-Agent-Cluster', '?1')

  return response
}

/**
 * Middleware helper para aplicar security headers
 */
export function withSecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  config?: SecurityHeadersConfig
): NextResponse {
  return addSecurityHeaders(response, config)
}

