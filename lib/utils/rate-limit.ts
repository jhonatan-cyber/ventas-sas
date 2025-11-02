/**
 * Sistema de Rate Limiting simple en memoria
 * Para producción, reemplazar con Redis + Upstash o similar
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class InMemoryRateLimit {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor(cleanupIntervalMs: number = 60000) {
    // Limpiar entradas expiradas cada minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)
  }

  /**
   * Verifica si una clave ha excedido el límite
   * @param key - Clave única para identificar el usuario/IP
   * @param limit - Número máximo de intentos
   * @param windowMs - Ventana de tiempo en milisegundos
   * @returns true si está dentro del límite, false si lo excedió
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Nueva entrada o entrada expirada
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }

    // Incrementar contador
    entry.count++
    return entry.count <= limit
  }

  /**
   * Obtiene información sobre el rate limit actual
   */
  getRemainingAttempts(key: string, limit: number): { remaining: number; resetTime: number | null } {
    const entry = this.store.get(key)
    
    if (!entry || Date.now() > entry.resetTime) {
      return { remaining: limit, resetTime: null }
    }

    return {
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    }
  }

  /**
   * Limpia las entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Elimina una entrada específica (útil para logout o éxito de login)
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Limpia todos los recursos
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Instancia singleton
export const rateLimiter = new InMemoryRateLimit()

/**
 * Middleware para rate limiting en login
 * @param identifier - IP, email, o combinación
 * @param limit - Número máximo de intentos
 * @param windowMs - Ventana de tiempo en ms
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos por defecto
): Promise<{ allowed: boolean; remaining: number; resetTime: number | null }> {
  const allowed = rateLimiter.check(identifier, limit, windowMs)
  const { remaining, resetTime } = rateLimiter.getRemainingAttempts(identifier, limit)

  return {
    allowed,
    remaining,
    resetTime
  }
}

/**
 * Genera un identificador único para rate limiting basado en IP y otros factores
 */
export function getRateLimitKey(request: NextRequest, additionalIdentifier?: string): string {
  const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  
  if (additionalIdentifier) {
    return `rate_limit:${additionalIdentifier}:${ip}`
  }
  
  return `rate_limit:${ip}:${userAgent.slice(0, 50)}`
}

// Tipos para TypeScript
import type { NextRequest } from 'next/server'

/**
 * Interfaz para configuraciones de rate limit
 */
export interface RateLimitConfig {
  limit: number
  windowMs: number
  message?: string
}

/**
 * Configuraciones predefinidas para diferentes endpoints
 */
export const rateLimitConfigs = {
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 intentos cada 15 minutos
    message: 'Demasiados intentos de login. Por favor, intenta más tarde.'
  } as RateLimitConfig,
  
  api: {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests por minuto
    message: 'Demasiadas solicitudes. Por favor, espera un momento.'
  } as RateLimitConfig,
  
  strict: {
    limit: 3,
    windowMs: 15 * 60 * 1000, // 3 intentos cada 15 minutos
    message: 'Demasiados intentos. Cuenta temporalmente bloqueada.'
  } as RateLimitConfig
}

/**
 * Helper para agregar headers de rate limit a la respuesta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number | null,
  limit: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  if (resetTime) {
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
  }
  return response
}

