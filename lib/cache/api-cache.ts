/**
 * Sistema de caché global para peticiones API
 * Evita peticiones duplicadas y mejora el rendimiento
 */

interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * Obtiene datos del caché o hace la petición si no existe
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = 30000 // 30 segundos por defecto
  ): Promise<T> {
    // Verificar si hay una petición pendiente para esta clave
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Verificar caché
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expiry) {
      return cached.data
    }

    // Hacer la petición y cachear el resultado
    const promise = fetcher().then(data => {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      })
      this.pendingRequests.delete(key)
      return data
    }).catch(error => {
      this.pendingRequests.delete(key)
      throw error
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Invalida una entrada del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Obtiene el tamaño del caché
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

// Instancia global del caché
export const apiCache = new ApiCache()

// Limpiar caché expirado cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 5 * 60 * 1000)
}

// Funciones de utilidad para endpoints comunes
export const getCachedOrganization = (slug: string) => {
  return apiCache.get(
    `organization-${slug}`,
    () => fetch(`/api/${slug}/organizacion`, { credentials: 'include' }).then(r => r.json()),
    60000 // 1 minuto
  )
}

export const getCachedPreferences = (slug: string) => {
  return apiCache.get(
    `preferences-${slug}`,
    () => fetch(`/api/${slug}/config/preferencias`, { credentials: 'include' }).then(r => r.json()),
    30000 // 30 segundos
  )
}

export const invalidateOrganizationCache = (slug: string) => {
  apiCache.invalidate(`organization-${slug}`)
}

export const invalidatePreferencesCache = (slug: string) => {
  apiCache.invalidate(`preferences-${slug}`)
}