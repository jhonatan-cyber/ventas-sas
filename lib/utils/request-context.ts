/**
 * Request Context y Correlation IDs
 * 
 * Permite rastrear requests a través de múltiples servicios
 */

import { NextRequest } from 'next/server'
import { generateCorrelationId } from './logger'

/**
 * Obtiene o genera un correlation ID para un request
 */
export function getCorrelationId(request: NextRequest): string {
  // Buscar en headers (X-Request-ID, X-Correlation-ID, X-Trace-ID)
  const correlationId = 
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    request.headers.get('x-trace-id') ||
    generateCorrelationId()
  
  return correlationId
}

/**
 * Extrae información del request para logging
 */
export function getRequestContext(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const method = request.method
  const url = request.url
  const pathname = new URL(url).pathname

  return {
    correlationId,
    ip,
    userAgent,
    method,
    url,
    pathname,
  }
}

/**
 * Crea contexto enriquecido para logging
 */
export function createRequestLogContext(
  request: NextRequest,
  additionalData?: Record<string, any>
) {
  const requestContext = getRequestContext(request)
  
  return {
    ...requestContext,
    ...additionalData,
  }
}

