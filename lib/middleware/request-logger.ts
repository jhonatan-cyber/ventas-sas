/**
 * Middleware para logging de requests HTTP
 * 
 * Integra correlation IDs y logging estructurado
 */

import { NextRequest, NextResponse } from 'next/server'
import { logRequest } from '@/lib/utils/logger'
import { getRequestContext } from '@/lib/utils/request-context'

/**
 * Middleware para logging de requests con timing
 */
export async function withRequestLogging(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now()
  const requestContext = getRequestContext(request)
  const method = request.method
  const pathname = new URL(request.url).pathname
  
  // Agregar correlation ID a headers de respuesta
  const response = await handler(request)
  
  const duration = Date.now() - startTime
  const statusCode = response.status
  
  // Log del request
  logRequest(
    method,
    pathname,
    statusCode,
    duration,
    {
      correlationId: requestContext.correlationId,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    }
  )
  
  // Agregar correlation ID a headers de respuesta para tracing
  response.headers.set('X-Correlation-ID', requestContext.correlationId)
  response.headers.set('X-Response-Time', `${duration}ms`)
  
  return response
}

