/**
 * Hook personalizado para manejo de errores de API
 * 
 * Estandariza el manejo de errores en componentes React
 */

"use client"

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { logger } from '@/lib/utils/logger'

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface UseApiErrorReturn {
  error: ApiError | null
  setError: (error: ApiError | null) => void
  handleError: (error: unknown, options?: HandleErrorOptions) => void
  clearError: () => void
  isError: boolean
}

export interface HandleErrorOptions {
  showToast?: boolean
  toastTitle?: string
  logError?: boolean
  onError?: (error: ApiError) => void
}

/**
 * Hook para manejar errores de API de forma consistente
 */
export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<ApiError | null>(null)

  const handleError = useCallback(
    (error: unknown, options: HandleErrorOptions = {}) => {
      const {
        showToast = true,
        toastTitle = 'Error',
        logError = true,
        onError,
      } = options

      // Extraer mensaje de error
      let errorMessage = 'Ha ocurrido un error'
      let errorCode: string | undefined
      let errorDetails: any = undefined

      if (error instanceof Error) {
        errorMessage = error.message
        errorDetails = { stack: error.stack }
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any
        errorMessage = err.message || err.error || errorMessage
        errorCode = err.code
        errorDetails = err.details || err.data
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      // Crear objeto de error
      const apiError: ApiError = {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
      }

      // Actualizar estado
      setError(apiError)

      // Loggear error (si está habilitado)
      if (logError) {
        const logData: Record<string, any> = {}
        if (errorCode) logData.code = errorCode
        if (errorDetails) logData.details = errorDetails
        
        logger.error('API Error en frontend', error instanceof Error ? error : new Error(errorMessage), Object.keys(logData).length > 0 ? logData : undefined)
      }

      // Mostrar toast (si está habilitado)
      if (showToast) {
        toast.error(toastTitle, {
          description: errorMessage,
        })
      }

      // Callback personalizado
      if (onError) {
        onError(apiError)
      }
    },
    []
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    setError,
    handleError,
    clearError,
    isError: error !== null,
  }
}

/**
 * Helper para extraer mensaje de error de una respuesta fetch
 */
export async function extractErrorFromResponse(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.error || data.message || `Error ${response.status}: ${response.statusText}`
  } catch {
    return `Error ${response.status}: ${response.statusText}`
  }
}

/**
 * Helper para manejar errores de fetch
 */
export async function handleFetchError(
  response: Response,
  _options?: HandleErrorOptions
): Promise<never> {
  const errorMessage = await extractErrorFromResponse(response)
  throw new Error(errorMessage)
}

