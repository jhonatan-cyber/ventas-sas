/**
 * Servicio de Geolocalización de IPs
 * 
 * Proporciona información de ubicación para análisis de seguridad
 */

interface GeolocationData {
  ip: string
  country?: string
  countryCode?: string
  region?: string
  regionCode?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  isp?: string
  organization?: string
  isVpn?: boolean
  isTor?: boolean
  isProxy?: boolean
  threatLevel?: 'low' | 'medium' | 'high'
  lastUpdated: Date
}

interface GeolocationProvider {
  name: string
  lookup(ip: string): Promise<GeolocationData | null>
}

class IPApiProvider implements GeolocationProvider {
  name = 'ipapi'
  private apiKey?: string
  private baseUrl = 'http://ip-api.com/json'

  constructor(apiKey?: string) {
    this.apiKey = apiKey
    if (apiKey) {
      this.baseUrl = 'https://pro.ip-api.com/json'
    }
  }

  async lookup(ip: string): Promise<GeolocationData | null> {
    try {
      const url = this.apiKey 
        ? `${this.baseUrl}/${ip}?key=${this.apiKey}&fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,proxy,hosting`
        : `${this.baseUrl}/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Enhanced-Auth-System/1.0',
        },
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'fail') {
        console.warn(`IP-API error for ${ip}:`, data.message)
        return null
      }

      return {
        ip,
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        regionCode: data.region,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        organization: data.org,
        isVpn: data.proxy || data.hosting || false,
        isTor: false, // IP-API no proporciona esta info
        isProxy: data.proxy || false,
        threatLevel: this.calculateThreatLevel(data),
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error(`Error en IP-API lookup para ${ip}:`, error)
      return null
    }
  }

  private calculateThreatLevel(data: any): 'low' | 'medium' | 'high' {
    if (data.proxy || data.hosting) return 'high'
    if (data.isp?.toLowerCase().includes('vpn') || 
        data.org?.toLowerCase().includes('vpn')) return 'medium'
    return 'low'
  }
}

class MaxMindProvider implements GeolocationProvider {
  name = 'maxmind'
  private apiKey: string
  private baseUrl = 'https://geoip.maxmind.com/geoip/v2.1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async lookup(ip: string): Promise<GeolocationData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/insights/${ip}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      return {
        ip,
        country: data.country?.names?.en,
        countryCode: data.country?.iso_code,
        region: data.subdivisions?.[0]?.names?.en,
        regionCode: data.subdivisions?.[0]?.iso_code,
        city: data.city?.names?.en,
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        timezone: data.location?.time_zone,
        isp: data.traits?.isp,
        organization: data.traits?.organization,
        isVpn: data.traits?.is_anonymous_proxy || false,
        isTor: data.traits?.is_tor_exit_node || false,
        isProxy: data.traits?.is_anonymous_proxy || false,
        threatLevel: this.calculateThreatLevel(data.traits),
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error(`Error en MaxMind lookup para ${ip}:`, error)
      return null
    }
  }

  private calculateThreatLevel(traits: any): 'low' | 'medium' | 'high' {
    if (traits?.is_tor_exit_node) return 'high'
    if (traits?.is_anonymous_proxy) return 'high'
    if (traits?.is_satellite_provider) return 'medium'
    return 'low'
  }
}

class GeolocationService {
  private providers: GeolocationProvider[] = []
  private cache = new Map<string, { data: GeolocationData; expires: number }>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    const provider = process.env.IP_GEOLOCATION_PROVIDER || 'ipapi'
    const apiKey = process.env.IP_GEOLOCATION_API_KEY

    switch (provider) {
      case 'maxmind':
        if (apiKey) {
          this.providers.push(new MaxMindProvider(apiKey))
        }
        break
      case 'ipapi':
      default:
        this.providers.push(new IPApiProvider(apiKey))
        break
    }

    // Siempre agregar IP-API como fallback gratuito
    if (provider !== 'ipapi') {
      this.providers.push(new IPApiProvider())
    }
  }

  /**
   * Obtiene información de geolocalización para una IP
   */
  async lookup(ip: string): Promise<GeolocationData | null> {
    // Validar IP
    if (!this.isValidIP(ip) || this.isPrivateIP(ip)) {
      return null
    }

    // Verificar caché
    const cached = this.cache.get(ip)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    // Intentar con cada proveedor
    for (const provider of this.providers) {
      try {
        const result = await provider.lookup(ip)
        if (result) {
          // Guardar en caché
          this.cache.set(ip, {
            data: result,
            expires: Date.now() + this.CACHE_TTL,
          })
          return result
        }
      } catch (error) {
        console.error(`Error con proveedor ${provider.name}:`, error)
        continue
      }
    }

    return null
  }

  /**
   * Analiza el riesgo de seguridad de una IP
   */
  async analyzeSecurityRisk(ip: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    reasons: string[]
    shouldBlock: boolean
    geolocation?: GeolocationData
  }> {
    const geo = await this.lookup(ip)
    const reasons: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (!geo) {
      return {
        riskLevel: 'low',
        reasons: ['No se pudo obtener información de geolocalización'],
        shouldBlock: false,
      }
    }

    // Análisis de riesgo
    if (geo.isTor) {
      reasons.push('Conexión desde red Tor')
      riskLevel = 'critical'
    }

    if (geo.isVpn || geo.isProxy) {
      reasons.push('Conexión desde VPN/Proxy')
      riskLevel = riskLevel === 'critical' ? 'critical' : 'high'
    }

    // Países de alto riesgo (configurable)
    const highRiskCountries = process.env.HIGH_RISK_COUNTRIES?.split(',') || []
    if (geo.countryCode && highRiskCountries.includes(geo.countryCode)) {
      reasons.push(`Conexión desde país de alto riesgo: ${geo.country}`)
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    }

    // ISPs sospechosos
    const suspiciousKeywords = ['hosting', 'datacenter', 'cloud', 'server']
    if (geo.isp && suspiciousKeywords.some(keyword => 
      geo.isp!.toLowerCase().includes(keyword))) {
      reasons.push('ISP sospechoso (hosting/datacenter)')
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    }

    const shouldBlock = riskLevel === 'critical' || 
      (riskLevel === 'high' && process.env.BLOCK_HIGH_RISK_IPS === 'true')

    return {
      riskLevel,
      reasons,
      shouldBlock,
      geolocation: geo,
    }
  }

  /**
   * Limpia caché expirado
   */
  cleanupCache(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [ip, cached] of this.cache.entries()) {
      if (cached.expires <= now) {
        this.cache.delete(ip)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      providersCount: this.providers.length,
      providers: this.providers.map(p => p.name),
      cacheSize: this.cache.size,
      cacheHitRate: this.getCacheHitRate(),
    }
  }

  private getCacheHitRate(): number {
    // Implementar tracking de hits/misses si es necesario
    return 0
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ]

    return privateRanges.some(range => range.test(ip))
  }
}

// Instancia singleton
export const geolocationService = new GeolocationService()

/**
 * Helper function para análisis rápido de IPs
 */
export async function analyzeIPSecurity(ip: string) {
  if (process.env.ENABLE_IP_GEOLOCATION !== 'true') {
    return {
      riskLevel: 'low' as const,
      reasons: ['Geolocalización deshabilitada'],
      shouldBlock: false,
    }
  }

  return await geolocationService.analyzeSecurityRisk(ip)
}

/**
 * Middleware para verificar IPs sospechosas
 */
export async function checkSuspiciousIP(ip: string): Promise<boolean> {
  try {
    const analysis = await analyzeIPSecurity(ip)
    return analysis.shouldBlock
  } catch (error) {
    console.error('Error verificando IP sospechosa:', error)
    return false // No bloquear en caso de error
  }
}