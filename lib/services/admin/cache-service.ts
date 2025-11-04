import NodeCache from 'node-cache'

// Cache global para toda la aplicación
const cache = new NodeCache({
  stdTTL: 300, // TTL por defecto: 5 minutos
  checkperiod: 60, // Verificar expiraciones cada 60 segundos
  useClones: false, // Mejor performance
})

export interface CacheStats {
  hits: number
  misses: number
  keys: number
  hitRate: number
  size: number
}

export class CacheService {
  private static stats = {
    hits: 0,
    misses: 0,
  }

  /**
   * Obtener valor del caché
   */
  static get<T>(key: string): T | undefined {
    const value = cache.get<T>(key)
    if (value !== undefined) {
      this.stats.hits++
      return value
    } else {
      this.stats.misses++
      return undefined
    }
  }

  /**
   * Establecer valor en caché
   */
  static set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return cache.set(key, value, ttl)
    }
    return cache.set(key, value)
  }

  /**
   * Obtener o establecer (get or set pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await fetchFn()
    this.set(key, value, ttl)
    return value
  }

  /**
   * Invalidar clave específica
   */
  static delete(key: string): number {
    return cache.del(key)
  }

  /**
   * Invalidar múltiples claves por patrón
   */
  static deleteByPattern(pattern: string): number {
    const keys = cache.keys()
    const regex = new RegExp(pattern)
    let deleted = 0

    keys.forEach(key => {
      if (regex.test(key)) {
        cache.del(key)
        deleted++
      }
    })

    return deleted
  }

  /**
   * Limpiar todo el caché
   */
  static flush(): void {
    cache.flushAll()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * Obtener estadísticas del caché
   */
  static getStats(): CacheStats {
    const keys = cache.keys()
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: keys.length,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.estimateSize(),
    }
  }

  /**
   * Resetear estadísticas
   */
  static resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * Obtener todas las claves
   */
  static getKeys(): string[] {
    return cache.keys()
  }

  /**
   * Verificar si una clave existe
   */
  static has(key: string): boolean {
    return cache.has(key)
  }

  /**
   * Invalidación inteligente basada en eventos
   */
  static invalidateByEvent(event: string, resourceId?: string): number {
    let deleted = 0

    switch (event) {
      case 'organization.updated':
      case 'organization.deleted':
        deleted += this.deleteByPattern(`^admin:organizations:`)
        deleted += this.deleteByPattern(`^admin:analytics:.*organization`)
        break

      case 'user.updated':
      case 'user.deleted':
        deleted += this.deleteByPattern(`^admin:users:`)
        if (resourceId) {
          deleted += this.delete(`admin:user:${resourceId}`)
        }
        break

      case 'subscription.updated':
      case 'subscription.deleted':
        deleted += this.deleteByPattern(`^admin:subscriptions:`)
        deleted += this.deleteByPattern(`^admin:analytics:revenue`)
        break

      case 'ticket.updated':
      case 'ticket.created':
        deleted += this.deleteByPattern(`^admin:support:`)
        break

      case 'invoice.updated':
      case 'payment.completed':
        deleted += this.deleteByPattern(`^admin:billing:`)
        deleted += this.deleteByPattern(`^admin:analytics:revenue`)
        break

      default:
        // Invalidación genérica
        if (resourceId) {
          deleted += this.deleteByPattern(`.*:${resourceId}`)
        }
    }

    return deleted
  }

  /**
   * Pre-cache datos frecuentes
   */
  static async preCache(key: string, fetchFn: () => Promise<any>, ttl?: number): Promise<void> {
    try {
      const value = await fetchFn()
      this.set(key, value, ttl)
    } catch (error) {
      console.error(`Error pre-caching ${key}:`, error)
    }
  }

  /**
   * Estimar tamaño del caché en MB
   */
  private static estimateSize(): number {
    const keys = cache.keys()
    let size = 0

    keys.forEach(key => {
      const value = cache.get(key)
      if (value) {
        // Estimación aproximada del tamaño en bytes
        const json = JSON.stringify(value)
        size += Buffer.byteLength(json, 'utf8')
      }
    })

    // Convertir a MB
    return Math.round((size / 1024 / 1024) * 100) / 100
  }
}

// Exportar instancia de caché para uso avanzado si es necesario
export { cache }
