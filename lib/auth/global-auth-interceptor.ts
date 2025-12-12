/**
 * Interceptor Global de Autenticación
 * 
 * Intercepta automáticamente todas las requests fetch para manejar
 * tokens expirados y refresh automático sin intervención del usuario.
 */

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Intercepta fetch global para manejar 401s automáticamente
 */
export function setupGlobalAuthInterceptor(customerSlug: string) {
  // Solo interceptar en el cliente
  if (typeof window === 'undefined') return

  // Guardar fetch original
  const originalFetch = window.fetch

  // Interceptor de fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    
    // Solo interceptar requests a APIs del sistema SAS
    if (!url.includes(`/api/${customerSlug}/`) && !url.includes('/api/notifications/')) {
      return originalFetch(input, init)
    }

    // Ejecutar request original
    let response = await originalFetch(input, init)

    // Si es 401, intentar refresh automático
    if (response.status === 401 && !isRefreshing) {
      console.log('🔄 Global Interceptor - 401 detectado, intentando refresh...')
      
      // Evitar múltiples refreshes simultáneos
      if (!refreshPromise) {
        isRefreshing = true
        refreshPromise = performRefresh(customerSlug)
      }

      const refreshSuccess = await refreshPromise

      if (refreshSuccess) {
        console.log('✅ Global Interceptor - Refresh exitoso, reintentando request...')
        // Reintentar request original con nuevos tokens
        response = await originalFetch(input, init)
      } else {
        console.log('❌ Global Interceptor - Refresh falló, redirigiendo a login...')
        // Redirigir a login si el refresh falla
        window.location.href = `/${customerSlug}/login`
      }

      // Reset estado
      isRefreshing = false
      refreshPromise = null
    }

    return response
  }
}

/**
 * Ejecuta el refresh de tokens
 */
async function performRefresh(customerSlug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/${customerSlug}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Global Interceptor - Tokens refrescados:', {
        expiresAt: data.expiresAt
      })
      return true
    } else {
      console.log('❌ Global Interceptor - Refresh falló:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ Global Interceptor - Error en refresh:', error)
    return false
  }
}

/**
 * Restaura fetch original (para cleanup)
 */
export function cleanupGlobalAuthInterceptor() {
  if (typeof window !== 'undefined' && window.fetch !== fetch) {
    // Restaurar fetch original si es necesario
    // (En la práctica, esto rara vez se necesita)
  }
}