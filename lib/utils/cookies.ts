/**
 * Utilidades para manejo de cookies en el lado del cliente
 * Funciones seguras y consistentes para el sistema SAS
 */

export interface CookieOptions {
  expires?: Date | number // Date object o días desde ahora
  maxAge?: number // segundos
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  httpOnly?: boolean // Solo para server-side
}

/**
 * Obtener una cookie por nombre
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()!.split(";").shift()
    return cookieValue ? decodeURIComponent(cookieValue) : null
  }
  
  return null
}

/**
 * Establecer una cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return
  
  const {
    expires,
    maxAge,
    path = '/',
    domain,
    secure,
    sameSite = 'lax'
  } = options
  
  let cookieString = `${name}=${encodeURIComponent(value)}`
  
  // Manejar expiración
  if (expires) {
    if (typeof expires === 'number') {
      // Si es número, tratarlo como días
      const expirationDate = new Date(Date.now() + expires * 24 * 60 * 60 * 1000)
      cookieString += `; Expires=${expirationDate.toUTCString()}`
    } else {
      // Si es Date object
      cookieString += `; Expires=${expires.toUTCString()}`
    }
  }
  
  if (maxAge) {
    cookieString += `; Max-Age=${maxAge}`
  }
  
  if (path) {
    cookieString += `; Path=${path}`
  }
  
  if (domain) {
    cookieString += `; Domain=${domain}`
  }
  
  // Auto-detectar secure en producción
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
  if (secure || isProduction) {
    cookieString += '; Secure'
  }
  
  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`
  }
  
  document.cookie = cookieString
}

/**
 * Eliminar una cookie
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    expires: new Date(0) // Fecha en el pasado
  })
}

/**
 * Verificar si una cookie existe
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null
}

/**
 * Obtener todas las cookies como objeto
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  
  const cookies: Record<string, string> = {}
  
  document.cookie.split(";").forEach(cookie => {
    const [name, value] = cookie.trim().split("=")
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  
  return cookies
}

/**
 * Funciones específicas para el sistema SAS
 */

/**
 * Obtener preferencias del usuario SAS
 */
export function getSasPreferences(slug: string): any | null {
  try {
    const raw = getCookie(`sas-prefs-${slug}`)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Error parsing SAS preferences:', error)
    return null
  }
}

/**
 * Guardar preferencias del usuario SAS
 */
export function setSasPreferences(slug: string, preferences: any): void {
  setCookie(`sas-prefs-${slug}`, JSON.stringify(preferences), {
    expires: 365, // 1 año
    sameSite: 'lax'
  })
}

/**
 * Obtener token de autenticación SAS
 */
export function getSasAuthToken(): string | null {
  return getCookie('sas-auth-token')
}

/**
 * Establecer token de autenticación SAS
 */
export function setSasAuthToken(token: string, rememberMe = false): void {
  setCookie('sas-auth-token', token, {
    expires: rememberMe ? 30 : 1, // 30 días si "recordarme", 1 día si no
    sameSite: 'strict',
    secure: true // Siempre seguro para tokens
  })
}

/**
 * Eliminar token de autenticación SAS
 */
export function clearSasAuthToken(): void {
  deleteCookie('sas-auth-token')
}

/**
 * Obtener sesión SAS
 */
export function getSasSession(): string | null {
  return getCookie('sas-session')
}

/**
 * Obtener token CSRF
 */
export function getCSRFToken(): string | null {
  return getCookie('csrf-token')
}

/**
 * Funciones de utilidad para temas y configuración
 */

/**
 * Obtener tema del usuario
 */
export function getTheme(): 'light' | 'dark' | null {
  const theme = getCookie('theme')
  return theme === 'light' || theme === 'dark' ? theme : null
}

/**
 * Establecer tema del usuario
 */
export function setTheme(theme: 'light' | 'dark'): void {
  setCookie('theme', theme, {
    expires: 365,
    sameSite: 'lax'
  })
}

