/**
 * CSRF Protection Utility
 * 
 * Protección contra ataques Cross-Site Request Forgery
 */

import { createHash, randomBytes } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-change-in-production'

/**
 * Genera un token CSRF
 */
export function generateCSRFToken(): string {
  const randomToken = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const combined = `${randomToken}:${timestamp}`
  
  // Crear hash del token
  const hash = createHash('sha256')
    .update(`${combined}:${CSRF_SECRET}`)
    .digest("hex")
  
  return `${randomToken}:${timestamp}:${hash}`
}

/**
 * Valida un token CSRF
 */
export function validateCSRFToken(token: string, cookieToken?: string): boolean {
  if (!token || !cookieToken) {
    return false
  }

  // Verificar que los tokens coincidan (parte aleatoria y timestamp)
  const [randomPart, timestamp] = token.split(":")
  const [cookieRandomPart, cookieTimestamp] = cookieToken.split(":")
  
  if (randomPart !== cookieRandomPart || timestamp !== cookieTimestamp) {
    return false
  }

  // Verificar hash del token en cookie
  const expectedHash = createHash('sha256')
    .update(`${cookieRandomPart}:${cookieTimestamp}:${CSRF_SECRET}`)
    .digest("hex")
  
  const [providedHash] = cookieToken.split(":").slice(-1)
  
  if (providedHash !== expectedHash) {
    return false
  }

  // Verificar que el token no sea muy antiguo (opcional: 24 horas)
  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = 24 * 60 * 60 * 1000 // 24 horas
  
  if (tokenAge > maxAge) {
    return false
  }

  return true
}

/**
 * Establece el token CSRF en las cookies de la respuesta
 */
export function setCSRFTokenCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCSRFToken()
  
  response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: true, // No accesible desde JavaScript (previene XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict', // Protección adicional
    path: '/',
    maxAge: 24 * 60 * 60, // 24 horas
  })

  return response
}

/**
 * Obtiene el token CSRF de las cookies
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value
}

/**
 * Obtiene el token CSRF del header
 */
export function getCSRFTokenFromHeader(request: NextRequest): string | undefined {
  return request.headers.get(CSRF_HEADER) || undefined
}

/**
 * Middleware para validar CSRF token en requests POST/PUT/DELETE
 */
export function validateCSRF(request: NextRequest): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase()

  // Solo validar métodos que modifican datos
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true }
  }

  // Obtener tokens
  const headerToken = getCSRFTokenFromHeader(request)
  const cookieToken = getCSRFTokenFromRequest(request)

  if (!headerToken || !cookieToken) {
    return {
      valid: false,
      error: 'CSRF token faltante',
    }
  }

  // Validar token
  const isValid = validateCSRFToken(headerToken, cookieToken)

  if (!isValid) {
    return {
      valid: false,
      error: 'CSRF token inválido o expirado',
    }
  }

  return { valid: true }
}

/**
 * Helper para obtener o generar token CSRF (para endpoints GET)
 */
export function getOrGenerateCSRFToken(request: NextRequest): string {
  const existingToken = getCSRFTokenFromRequest(request)
  return existingToken || generateCSRFToken()
}

/**
 * Helper para incluir en respuestas GET que necesitan CSRF token
 */
export function addCSRFToResponse(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const token = getOrGenerateCSRFToken(request)
  return setCSRFTokenCookie(response, token)
}

/**
 * Helper para validar CSRF y lanzar error si es inválido
 */
export function requireCSRF(request: NextRequest): void {
  const validation = validateCSRF(request)
  
  if (!validation.valid) {
    throw AppError.forbidden(validation.error || 'CSRF token inválido')
  }
}

