/**
 * Servicio de Caché
 * 
 * Sistema de caché en memoria usando NodeCache
 * Para producción con múltiples instancias, considerar Redis
 */

import NodeCache from 'node-cache'

interface CacheConfig {
  stdTTL?: number // Tiempo de vida por defecto en segundos
  checkperiod?: number // Intervalo de verificación de expiración
  useClones?: boolean // Clonar objetos al guardar
  deleteOnExpire?: boolean // Eliminar automáticamente al expirar
}

class CacheService {
  private cache: NodeCache
  private readonly DEFAULT_TTL = 300 // 5 minutos por defecto

  constructor(config: CacheConfig = {}) {
    this.cache = new NodeCache({
      stdTTL: config.stdTTL || this.DEFAULT_TTL,
      checkperiod: config.checkperiod || 60, // Verificar cada minuto
      useClones: config.useClones !== false, // Clonar por defecto
      deleteOnExpire: config.deleteOnExpire !== false,
    })

    // Estadísticas de caché (útil para monitoreo)
    this.cache.on('set', () => {
      if (process.env.NODE_ENV === 'development') {
        // Log opcional en desarrollo
      }
    })
  }

  /**
   * Obtiene datos del caché o ejecuta el fetcher si no está en caché
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = this.cache.get<T>(key)

    if (cached !== undefined) {
      return cached
    }

    // Si no está en caché, ejecutar fetcher
    const data = await fetcher()

    // Guardar en caché con TTL específico o por defecto
    this.cache.set(key, data, ttl || this.DEFAULT_TTL)

    return data
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || this.DEFAULT_TTL)
  }

  /**
   * Elimina una clave específica del caché
   */
  delete(key: string): number {
    return this.cache.del(key)
  }

  /**
   * Elimina múltiples claves del caché usando un patrón
   */
  deletePattern(pattern: string): number {
    const keys = this.cache.keys()
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    let deletedCount = 0

    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.del(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.flushAll()
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    return this.cache.getStats()
  }

  /**
   * Verifica si una clave existe en el caché
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Obtiene el TTL restante de una clave
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key)
  }
}

// Instancia singleton del servicio de caché
export const cacheService = new CacheService({
  stdTTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar expiración cada minuto
})

/**
 * Helper para obtener datos con caché
 * 
 * @example
 * const categories = await getCachedData(
 *   `categories_${customerId}`,
 *   () => CategoryService.getActiveCategories(customerId),
 *   600 // Cache por 10 minutos
 * )
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return cacheService.getOrSet(key, fetcher, ttl)
}

/**
 * Helper para invalidar caché por patrón
 * 
 * @example
 * // Invalidar todos los cachés de categorías de un cliente
 * invalidateCachePattern(`categories_${customerId}*`)
 */
export function invalidateCachePattern(pattern: string): number {
  return cacheService.deletePattern(pattern)
}

/**
 * Helper para invalidar una clave específica
 */
export function invalidateCache(key: string): void {
  cacheService.delete(key)
}

/**
 * Helper para limpiar todo el caché
 */
export function clearAllCache(): void {
  cacheService.clear()
}

/**
 * Prefijos de caché para organización
 */
export const CacheKeys = {
  // Categorías
  category: (customerId: string, filters?: string) => 
    `category:${customerId}${filters ? `:${filters}` : ''}`,
  
  // Productos
  product: (customerId: string, filters?: string) => 
    `product:${customerId}${filters ? `:${filters}` : ''}`,
  
  // Clientes
  customer: (customerId: string) => `customer:${customerId}`,
  
  // Usuarios
  user: (userId: string) => `user:${userId}`,
  userList: (customerId: string, filters?: string) => 
    `user:list:${customerId}${filters ? `:${filters}` : ''}`,
  
  // Roles
  role: (customerId: string) => `role:${customerId}`,
  
  // Sucursales
  branch: (customerId: string) => `branch:${customerId}`,
  
  // Estadísticas
  stats: (organizationId: string, type: string) => 
    `stats:${organizationId}:${type}`,
  
  // Dashboard
  dashboard: (organizationId: string) => `dashboard:${organizationId}`,
}

export { CacheService }

