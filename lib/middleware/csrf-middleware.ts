/**
 * CSRF Middleware para API Routes
 * 
 * Usar este middleware en endpoints que modifican datos
 */

import { NextRequest } from 'next/server'

import { requireCSRF } from '@/lib/utils/csrf-protection'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * Wrapper para proteger endpoints con CSRF
 */
export function withCSRF<T = any>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<T> => {
    try {
      // Validar CSRF token
      requireCSRF(request)
      
      // Si pasa la validación, ejecutar el handler
      return await handler(request, ...args)
    } catch (error) {
      // El error ya fue lanzado por requireCSRF como AppError
      if (error instanceof Error && 'statusCode' in error) {
        return handleApiError(
          error,
          createErrorContext(request, { action: 'CSRF_VALIDATION' })
        ) as T
      }
      throw error
    }
  }
}

