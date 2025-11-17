/**
 * Utilidades para leer las preferencias del usuario desde la API
 * 
 * NOTA: Las preferencias ahora se almacenan en la base de datos (tabla sales_configuration_sas).
 * Este módulo proporciona funciones de utilidad con caché en memoria y fallback a cookies
 * para compatibilidad durante la transición.
 */

// Cache en memoria para las configuraciones
let configCache: Map<string, { config: Partial<SasPrefs>; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Invalida el caché de configuraciones para un slug específico
 * Útil cuando se actualiza la configuración
 */
export function invalidateConfigCache(slug: string): void {
  configCache.delete(slug)
}

/**
 * Invalida todo el caché de configuraciones
 */
export function clearConfigCache(): void {
  configCache.clear()
}

/**
 * Obtiene el slug de la organización desde la URL actual
 * @returns El slug o null si no se puede obtener
 */
export function getSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  const pathname = window.location.pathname
  // La URL tiene el formato /[slug]/...
  const match = pathname.match(/^\/([^/]+)/)
  return match ? match[1] : null
}

type SasPrefs = {
  currency: string
  dateFormat: string
  themeColor: string
  language?: string
  whatsappNumber: string
  companyName?: string
  companyNIT?: string
  companyPhone?: string
  companyAddress?: string
  companyWebsite?: string
  companyLogo?: string
  companyWhatsappNumber?: string
  whatsappCountryCode?: string
  branchCount?: number
}

/**
 * Lee las preferencias del usuario desde la API (con caché) o cookies como fallback
 * @param slug - El slug de la organización
 * @returns Las preferencias guardadas o valores por defecto
 */
export async function readPreferencesAsync(slug: string): Promise<Partial<SasPrefs>> {
  if (typeof window === 'undefined') {
    return {
      currency: 'BOB',
      dateFormat: 'dd/MM/yyyy',
      themeColor: 'green',
      language: 'es',
    }
  }

  // Verificar caché
  const cached = configCache.get(slug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }

  // Intentar cargar desde API
  try {
    const response = await fetch(`/api/${slug}/config/preferencias`, {
      credentials: 'include'
    })
    if (response.ok) {
      const data = await response.json()
      if (data?.success && data.configuration) {
        const config: Partial<SasPrefs> = {
          currency: data.configuration.currency || 'BOB',
          dateFormat: data.configuration.dateFormat || 'dd/MM/yyyy',
          themeColor: data.configuration.themeColor || 'green',
          language: data.configuration.language || 'es',
        }
        // Actualizar caché
        configCache.set(slug, { config, timestamp: Date.now() })
        // Actualizar caché de idioma también
        if (typeof window !== 'undefined' && config.language) {
          try {
            const { updateLanguageCache } = require('./i18n')
            updateLanguageCache(slug, config.language)
          } catch (error) {
            // Ignorar errores de importación (puede fallar en SSR)
            if (typeof window !== 'undefined') {
              console.warn('No se pudo actualizar caché de idioma:', error)
            }
          }
        }
        return config
      }
    }
  } catch {
    // Si falla la API, continuar con cookies
  }

  // Fallback a cookies
  try {
    const raw = document.cookie.split('; ').find(c => c.startsWith(`sas-prefs-${slug}=`))?.split('=')[1]
    if (raw) {
      const prefs = JSON.parse(decodeURIComponent(raw))
      // Actualizar caché con datos de cookies
      configCache.set(slug, { config: prefs, timestamp: Date.now() })
      return prefs
    }
  } catch {
    // Si hay error, retornar valores por defecto
  }

  const defaults = {
    currency: 'BOB',
    dateFormat: 'dd/MM/yyyy',
    themeColor: 'green',
    language: 'es',
  }
  configCache.set(slug, { config: defaults, timestamp: Date.now() })
  return defaults
}

/**
 * Lee las preferencias del usuario (síncrono, para compatibilidad)
 * 
 * NOTA: Esta función ahora lee del caché en memoria que se actualiza desde la API.
 * Si el caché está vacío, intenta leer de cookies como fallback temporal.
 * 
 * @param slug - El slug de la organización
 * @returns Las preferencias guardadas o valores por defecto
 */
export function readPreferences(slug: string): Partial<SasPrefs> {
  if (typeof document === 'undefined') {
    return {
      currency: 'BOB',
      dateFormat: 'dd/MM/yyyy',
      themeColor: 'green',
      language: 'es',
    }
  }

  // Verificar caché primero (se actualiza desde la API)
  const cached = configCache.get(slug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }

  // Fallback temporal: leer de cookies (solo durante transición)
  // TODO: Eliminar este fallback una vez confirmado que todo funciona
  try {
    const raw = document.cookie.split('; ').find(c => c.startsWith(`sas-prefs-${slug}=`))?.split('=')[1]
    if (raw) {
      const prefs = JSON.parse(decodeURIComponent(raw))
      // Actualizar caché
      configCache.set(slug, { config: prefs, timestamp: Date.now() })
      return prefs
    }
  } catch {
    // Si hay error, retornar valores por defecto
  }

  const defaults = {
    currency: 'BOB',
    dateFormat: 'dd/MM/yyyy',
    themeColor: 'green',
    language: 'es',
  }
  configCache.set(slug, { config: defaults, timestamp: Date.now() })
  return defaults
}

/**
 * Obtiene la moneda seleccionada por el usuario
 * @param slug - El slug de la organización
 * @returns El código de moneda (por defecto 'BOB')
 */
export function getCurrency(slug: string): string {
  const prefs = readPreferences(slug)
  return prefs.currency || 'BOB'
}

/**
 * Obtiene el formato de fecha seleccionado por el usuario
 * @param slug - El slug de la organización
 * @returns El formato de fecha (por defecto 'dd/MM/yyyy')
 */
export function getDateFormat(slug: string): string {
  const prefs = readPreferences(slug)
  return prefs.dateFormat || 'dd/MM/yyyy'
}

/**
 * Formatea una fecha según las preferencias del usuario
 * @param date - La fecha a formatear
 * @param slug - El slug de la organización (opcional, se obtiene de la URL si no se proporciona)
 * @returns La fecha formateada
 */
export function formatDateWithPreferences(date: Date | string, slug?: string): string {
  const d = new Date(date)
  const actualSlug = slug || getSlugFromUrl() || ''
  const dateFormat = getDateFormat(actualSlug)

  // Mapeo de formatos
  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    'dd/MM/yy': { day: '2-digit', month: '2-digit', year: '2-digit' },
    'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
    'MM/dd/yy': { month: '2-digit', day: '2-digit', year: '2-digit' },
    'MM/dd/yyyy': { month: '2-digit', day: '2-digit', year: 'numeric' },
    'yyyy-MM-dd': { year: 'numeric', month: '2-digit', day: '2-digit' },
  }

  const options = formatMap[dateFormat] || formatMap['dd/MM/yyyy']
  
  return d.toLocaleDateString('es-BO', options)
}

/**
 * @deprecated Las preferencias ahora se almacenan en la base de datos.
 * Usa la API directamente o las funciones de utilidades que leen del caché.
 * 
 * Lee las preferencias del usuario desde cookies del servidor (LEGACY)
 * @param cookieStore - El store de cookies de Next.js
 * @param slug - El slug de la organización
 * @returns Las preferencias guardadas o valores por defecto
 */
export function readPreferencesFromServer(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  slug: string
): Partial<SasPrefs> {
  // TODO: Eliminar esta función una vez que todos los componentes usen la API
  try {
    const cookie = cookieStore.get(`sas-prefs-${slug}`)
    if (cookie?.value) {
      return JSON.parse(decodeURIComponent(cookie.value))
    }
  } catch {
    // Si hay error, retornar valores por defecto
  }

  return {
    currency: 'BOB',
    dateFormat: 'dd/MM/yyyy',
    themeColor: 'green',
    language: 'es',
  }
}

/**
 * @deprecated Usa getCurrency() que lee del caché actualizado desde la API.
 * 
 * Obtiene la moneda desde cookies del servidor (LEGACY)
 * @param cookieStore - El store de cookies de Next.js
 * @param slug - El slug de la organización
 * @returns El código de moneda (por defecto 'BOB')
 */
export function getCurrencyFromServer(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  slug: string
): string {
  const prefs = readPreferencesFromServer(cookieStore, slug)
  return prefs.currency || 'BOB'
}

/**
 * Formatea una cantidad monetaria según las preferencias del usuario
 * @param amount - La cantidad a formatear
 * @param slug - El slug de la organización (opcional, se obtiene de la URL si no se proporciona)
 * @param currencyOverride - Moneda opcional para sobrescribir la preferencia
 * @returns La cantidad formateada
 */
export function formatCurrencyWithPreferences(
  amount: number | string,
  slug?: string,
  currencyOverride?: string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const actualSlug = slug || getSlugFromUrl() || ''
  const currency = currencyOverride || getCurrency(actualSlug)

  // Mapeo de códigos de moneda a locales
  const currencyLocaleMap: Record<string, string> = {
    'BOB': 'es-BO',
    'USD': 'en-US',
    'EUR': 'de-DE',
    'ARS': 'es-AR',
    'BRL': 'pt-BR',
    'CLP': 'es-CL',
    'COP': 'es-CO',
    'MXN': 'es-MX',
    'PEN': 'es-PE',
    'UYU': 'es-UY',
    'VES': 'es-VE',
  }

  const locale = currencyLocaleMap[currency] || 'es-BO'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * @deprecated Usa formatCurrencyWithPreferences() que lee del caché actualizado desde la API.
 * 
 * Formatea una cantidad monetaria desde el servidor usando cookies (LEGACY)
 * @param amount - La cantidad a formatear
 * @param cookieStore - El store de cookies de Next.js
 * @param slug - El slug de la organización
 * @returns La cantidad formateada
 */
export function formatCurrencyWithPreferencesFromServer(
  amount: number | string,
  cookieStore: { get: (name: string) => { value: string } | undefined },
  slug: string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const currency = getCurrencyFromServer(cookieStore, slug)

  // Mapeo de códigos de moneda a locales
  const currencyLocaleMap: Record<string, string> = {
    'BOB': 'es-BO',
    'USD': 'en-US',
    'EUR': 'de-DE',
    'ARS': 'es-AR',
    'BRL': 'pt-BR',
    'CLP': 'es-CL',
    'COP': 'es-CO',
    'MXN': 'es-MX',
    'PEN': 'es-PE',
    'UYU': 'es-UY',
    'VES': 'es-VE',
  }

  const locale = currencyLocaleMap[currency] || 'es-BO'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

