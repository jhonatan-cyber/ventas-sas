/**
 * Hook de Autenticación Empresarial
 * 
 * Características:
 * - Auto-refresh transparente en el cliente
 * - Manejo de estados de autenticación
 * - Interceptor de requests para APIs
 * - Notificaciones de sesión
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  sessionExpiry: Date | null
  lastActivity: Date | null
}

interface UseEnhancedAuthOptions {
  customerSlug: string
  autoRefresh?: boolean
  onSessionExpired?: () => void
  onTokenRefreshed?: () => void
}

export function useEnhancedAuth(options: UseEnhancedAuthOptions) {
  const { customerSlug, autoRefresh = true, onSessionExpired, onTokenRefreshed } = options
  const router = useRouter()

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    sessionExpiry: null,
    lastActivity: null,
  })

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const handleSessionExpiredRef = useRef<(() => void) | null>(null)

  /**
   * Verifica el estado de autenticación actual
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/auth/status`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          sessionExpiry: data.expiresAt ? new Date(data.expiresAt) : null,
          lastActivity: new Date(),
        }))

        // Programar próximo refresh si está habilitado y no hay uno ya programado
        if (autoRefresh && data.expiresAt && !refreshTimeoutRef.current) {
          scheduleTokenRefresh(new Date(data.expiresAt))
        }

        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          sessionExpiry: null,
        }))
        return false
      }
    } catch (error) {
      console.error('Error verificando estado de auth:', error)
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionExpiry: null,
      }))
      return false
    }
  }, [customerSlug, autoRefresh])

  /**
   * Refresca tokens automáticamente
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('🔄 Refresh ya en progreso, saltando...')
      return false
    }

    console.log('🔄 Iniciando refresh de tokens...')
    isRefreshingRef.current = true

    // Cancelar cualquier refresh programado para evitar duplicados
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }

    try {
      const response = await fetch(`/api/${customerSlug}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Refresh exitoso:', {
          expiresAt: data.expiresAt,
          timeUntilExpiry: data.expiresAt ? new Date(data.expiresAt).getTime() - Date.now() : null
        })

        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          sessionExpiry: data.expiresAt ? new Date(data.expiresAt) : null,
          lastActivity: new Date(),
        }))

        // Programar próximo refresh solo si no hay uno ya programado
        if (autoRefresh && data.expiresAt && !refreshTimeoutRef.current) {
          scheduleTokenRefresh(new Date(data.expiresAt))
        }

        onTokenRefreshed?.()
        return true
      } else {
        console.error('❌ Refresh falló:', response.status, response.statusText)

        // Solo cerrar sesión si es un error de autenticación (401/403)
        // Si es 500 u otro, intentamos reintentar luego
        if (response.status === 401 || response.status === 403) {
          handleSessionExpired()
        } else {
          // Reintentar en 1 minuto si hay error de servidor/red
          console.log('⚠️ Programando reintento de refresh en 1 minuto...')
          refreshTimeoutRef.current = setTimeout(() => {
            refreshTokens()
          }, 60 * 1000)
        }
        return false
      }
    } catch (error) {
      console.error('❌ Error refrescando tokens:', error)
      // No cerrar sesión por errores de red, reintentar
      console.log('⚠️ Error de red, programando reintento en 1 minuto...')
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTokens()
      }, 60 * 1000)
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [customerSlug, autoRefresh, onTokenRefreshed])

  /**
   * Programa el próximo refresh automático
   */
  const scheduleTokenRefresh = useCallback((expiryDate: Date) => {
    // Cancelar refresh anterior si existe
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }

    // Refrescar 5 minutos antes de expirar (más agresivo)
    const refreshTime = expiryDate.getTime() - Date.now() - (5 * 60 * 1000)

    console.log('🔄 Programando refresh automático:', {
      expiryDate: expiryDate.toISOString(),
      refreshInMs: refreshTime,
      refreshInMinutes: Math.round(refreshTime / (60 * 1000)),
      currentTime: new Date().toISOString(),
      isRefreshing: isRefreshingRef.current
    })

    if (refreshTime > 0 && !isRefreshingRef.current) {
      refreshTimeoutRef.current = setTimeout(() => {
        // Verificar nuevamente que no hay refresh en progreso
        if (!isRefreshingRef.current) {
          console.log('⏰ Ejecutando refresh automático programado')
          refreshTokens()
        } else {
          console.log('🔄 Refresh cancelado - ya hay uno en progreso')
        }
      }, refreshTime)
    } else if (refreshTime <= 0) {
      console.warn('⚠️ Tiempo de refresh negativo, token ya expirado:', refreshTime)
    } else {
      console.log('🔄 Refresh no programado - ya hay uno en progreso')
    }
  }, [refreshTokens])

  /**
   * Maneja expiración de sesión
   */
  const handleSessionExpired = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      sessionExpiry: null,
      lastActivity: null,
    })

    // Limpiar timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }

    onSessionExpired?.()

    // Mostrar notificación y redirigir
    toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
    router.push(`/${customerSlug}/login`)
  }, [customerSlug, router, onSessionExpired])

  // Update ref when handleSessionExpired changes
  useEffect(() => {
    handleSessionExpiredRef.current = handleSessionExpired
  }, [handleSessionExpired])

  /**
   * Registra actividad del usuario
   */
  /*
   * Registra actividad del usuario
   */
  const lastActivityRecordRef = useRef<number>(0)

  const recordActivity = useCallback(() => {
    const now = Date.now()

    // Solo actualizar estado visualmente cada 5 segundos para evitar re-renders excesivos
    if (now - lastActivityRecordRef.current > 5000) {
      lastActivityRecordRef.current = now
      setAuthState(prev => ({
        ...prev,
        lastActivity: new Date(),
      }))
    }

    // Resetear timeout de inactividad (siempre)
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }

    // 20 minutos de inactividad (mayor que el token de acceso de 15 min)
    activityTimeoutRef.current = setTimeout(() => {
      handleSessionExpiredRef.current?.()
    }, 20 * 60 * 1000)
  }, []) // No dependencies to prevent infinite re-renders

  /**
   * Logout manual
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`/api/${customerSlug}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      handleSessionExpired()
    }
  }, [customerSlug, handleSessionExpired])

  /**
   * Interceptor para requests de API
   */
  const apiRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    recordActivity()

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    })

    // Si es 401, intentar refresh automático
    if (response.status === 401 && autoRefresh) {
      const refreshSuccess = await refreshTokens()

      if (refreshSuccess) {
        // Reintentar request original
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      }
    }

    return response
  }, [recordActivity, autoRefresh, refreshTokens])

  /**
   * Obtiene información de sesiones activas
   */
  const getActiveSessions = useCallback(async () => {
    try {
      const response = await apiRequest(`/api/${customerSlug}/auth/sessions`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error obteniendo sesiones activas:', error)
    }
    return []
  }, [customerSlug, apiRequest])

  /**
   * Cierra todas las demás sesiones
   */
  const logoutOtherSessions = useCallback(async () => {
    try {
      const response = await apiRequest(`/api/${customerSlug}/auth/logout-others`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Otras sesiones cerradas correctamente')
        return true
      }
    } catch (error) {
      console.error('Error cerrando otras sesiones:', error)
      toast.error('Error al cerrar otras sesiones')
    }
    return false
  }, [customerSlug, apiRequest])

  // Inicializar autenticación e interceptor global
  useEffect(() => {
    checkAuthStatus()

    // Configurar interceptor global para manejar 401s automáticamente
    import('@/lib/auth/global-auth-interceptor').then(({ setupGlobalAuthInterceptor }) => {
      setupGlobalAuthInterceptor(customerSlug)
    })
  }, [checkAuthStatus, customerSlug])

  // Registrar actividad en eventos del usuario
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    const handleActivity = () => recordActivity()

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [authState.isAuthenticated, recordActivity])

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Estado
    ...authState,

    // Acciones
    refreshTokens,
    logout,
    checkAuthStatus,
    recordActivity,

    // Utilidades
    apiRequest,
    getActiveSessions,
    logoutOtherSessions,

    // Información de sesión
    timeUntilExpiry: authState.sessionExpiry
      ? Math.max(0, authState.sessionExpiry.getTime() - Date.now())
      : null,
    isNearExpiry: authState.sessionExpiry
      ? (authState.sessionExpiry.getTime() - Date.now()) < (5 * 60 * 1000) // 5 minutos
      : false,
  }
}