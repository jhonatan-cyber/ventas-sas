/**
 * Hook personalizado para cargar y gestionar configuraciones del sistema SAS
 * 
 * Este hook reemplaza la lectura directa de cookies y proporciona:
 * - Carga automática desde la API
 * - Caché en memoria
 * - Invalidación automática
 * - Fallback a valores por defecto
 */

import { useState, useEffect, useCallback, useRef } from 'react'

import { invalidateConfigCache } from '@/lib/utils/preferences'

interface Configuration {
  id: string
  organizationId: string
  currency: string | null
  dateFormat: string | null
  themeColor: string | null
  timezone: string | null
  language: string | null
  decimalPlaces: number | null
  numberFormat: string | null
  notificationsEnabled: boolean | null
  autoSave: boolean | null
  defaultBranchId: string | null
  invoicePrefix: string | null
  invoiceNumberFormat: string | null
  taxRate: number | null
  receiptFooter: string | null
  whatsappNumber: string | null
  whatsappCountryCode: string | null
  createdAt: string
  updatedAt: string
  defaultBranch?: {
    id: string
    name: string
  } | null
}

interface UseConfigurationOptions {
  autoLoad?: boolean
  onError?: (error: Error) => void
}

interface UseConfigurationReturn {
  configuration: Configuration | null
  isLoading: boolean
  error: Error | null
  reload: () => Promise<void>
  updateConfiguration: (updates: Partial<Configuration>) => Promise<boolean>
  getValue: <K extends keyof Configuration>(key: K) => Configuration[K] | null
}

const defaultConfiguration: Partial<Configuration> = {
  currency: 'BOB',
  dateFormat: 'dd/MM/yyyy',
  themeColor: 'green',
  timezone: 'America/La_Paz',
  language: 'es',
  decimalPlaces: 2,
  numberFormat: 'standard',
  notificationsEnabled: true,
  autoSave: true,
  invoiceNumberFormat: 'sequential',
  taxRate: 0,
  whatsappCountryCode: '+591',
}

/**
 * Hook para gestionar configuraciones del sistema SAS
 * 
 * @param customerSlug - El slug de la organización
 * @param options - Opciones del hook
 * @returns Objeto con configuración, estado de carga y funciones de gestión
 */
export function useConfiguration(
  customerSlug: string,
  options: UseConfigurationOptions = {}
): UseConfigurationReturn {
  const { autoLoad = true, onError } = options

  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [isLoading, setIsLoading] = useState(autoLoad)
  const [error, setError] = useState<Error | null>(null)
  
  // Usar useRef para mantener una referencia estable a onError
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  /**
   * Carga la configuración desde la API
   */
  const loadConfiguration = useCallback(async () => {
    if (!customerSlug) {
      setError(new Error('Customer slug is required'))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/${customerSlug}/config/preferencias`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.configuration) {
        setConfiguration(data.configuration)
        // Aplicar color del tema inmediatamente
        if (data.configuration.themeColor) {
          document.documentElement.setAttribute('data-sas-color', data.configuration.themeColor)
        }
        // Actualizar caché de idioma
        if (data.configuration.language && typeof window !== 'undefined') {
          try {
            const { updateLanguageCache } = await import('@/lib/utils/i18n')
            updateLanguageCache(customerSlug, data.configuration.language)
          } catch {
            // Ignorar errores de importación
          }
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      if (onErrorRef.current) {
        onErrorRef.current(error)
      }
      console.error('Error loading configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug]) // onError está en ref, no necesita estar en dependencias

  /**
   * Actualiza la configuración en la API
   */
  const updateConfiguration = useCallback(
    async (updates: Partial<Configuration>): Promise<boolean> => {
      if (!customerSlug) {
        setError(new Error('Customer slug is required'))
        return false
      }

      try {
        const response = await fetch(`/api/${customerSlug}/config/preferencias`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          throw new Error(`Failed to update configuration: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.configuration) {
          // Actualizar estado solo si hay cambios reales para evitar re-renders innecesarios
          setConfiguration(prev => {
            // Comparar si realmente hay cambios
            if (prev && JSON.stringify(prev) === JSON.stringify(data.configuration)) {
              return prev // No actualizar si es el mismo objeto
            }
            return data.configuration
          })
          // Invalidar caché
          invalidateConfigCache(customerSlug)
          // Aplicar cambios inmediatamente
          if (data.configuration.themeColor) {
            document.documentElement.setAttribute('data-sas-color', data.configuration.themeColor)
          }
          // Actualizar caché de idioma si cambió
          if (data.configuration.language && typeof window !== 'undefined') {
            try {
              const { updateLanguageCache } = await import('@/lib/utils/i18n')
              updateLanguageCache(customerSlug, data.configuration.language)
            } catch {
              // Ignorar errores de importación
            }
          }
          return true
        }

        return false
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        if (onErrorRef.current) {
          onErrorRef.current(error)
        }
        console.error('Error updating configuration:', error)
        return false
      }
    },
    [customerSlug] // onError está en ref, no necesita estar en dependencias
  )

  /**
   * Obtiene un valor específico de la configuración con fallback a valores por defecto
   */
  const getValue = useCallback(
    <K extends keyof Configuration>(key: K): Configuration[K] | null => {
      if (configuration && configuration[key] !== null && configuration[key] !== undefined) {
        return configuration[key]
      }
      // Fallback a valores por defecto
      return (defaultConfiguration[key] as Configuration[K]) || null
    },
    [configuration]
  )

  // Cargar automáticamente al montar si autoLoad está habilitado
  useEffect(() => {
    if (autoLoad && customerSlug) {
      loadConfiguration()
    }
     
  }, [autoLoad, customerSlug]) // loadConfiguration es estable gracias a useCallback

  return {
    configuration,
    isLoading,
    error,
    reload: loadConfiguration,
    updateConfiguration,
    getValue,
  }
}

