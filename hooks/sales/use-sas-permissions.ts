"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export interface SasUserPermissions {
  permissions: string[]
  isLoading: boolean
  hasPermissions: boolean // Indica si el usuario tiene permisos definidos
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  clearCache: () => void
  forceRefresh: () => Promise<void>
}

/**
 * Hook para obtener los permisos del usuario SAS logueado
 */
export function useSasPermissions(): SasUserPermissions {
  const params = useParams()
  const slug = params?.slug as string
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Efecto para hidratación del cliente
  useEffect(() => {
    setIsHydrated(true)
    
    if (!slug) {
      setIsLoading(false)
      return
    }

    // Intentar cargar desde caché primero, pero también verificar si es reciente
    try {
      const cached = sessionStorage.getItem(`sas-permissions-${slug}`)
      const cacheTimestamp = sessionStorage.getItem(`sas-permissions-timestamp-${slug}`)
      
      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp)
        const maxCacheAge = 5 * 60 * 1000 // 5 minutos
        
        if (cacheAge < maxCacheAge) {
          const cachedPermissions = JSON.parse(cached)
          setPermissions(cachedPermissions)
          setIsLoading(false)
          return // Usar caché si es reciente
        } else {
          // Caché expirado, limpiar
          sessionStorage.removeItem(`sas-permissions-${slug}`)
          sessionStorage.removeItem(`sas-permissions-timestamp-${slug}`)
        }
      }
    } catch (error) {
      console.error('Error loading cached permissions:', error)
    }

    // Si no hay caché, hacer fetch
    const fetchPermissions = async () => {
      try {
        const response = await fetch(`/api/${slug}/auth/permissions`, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const perms = data.permissions || []
          setPermissions(perms)
          
          // Guardar en sessionStorage para próximas cargas con timestamp
          try {
            sessionStorage.setItem(`sas-permissions-${slug}`, JSON.stringify(perms))
            sessionStorage.setItem(`sas-permissions-timestamp-${slug}`, Date.now().toString())
          } catch (error) {
            console.error('Error caching permissions:', error)
          }
        } else {
          setPermissions([])
          sessionStorage.removeItem(`sas-permissions-${slug}`)
        }
      } catch (error) {
        console.error('Error fetching SAS permissions:', error)
        setPermissions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [slug])

  // Efecto para conectar a SSE y escuchar cambios de permisos en tiempo real
  useEffect(() => {
    if (!slug || !isHydrated) return

    // Conectar a SSE para recibir actualizaciones de permisos
    const connectToSSE = () => {
      try {
        const eventSource = new EventSource(`/api/${slug}/permissions/events`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('Conectado a eventos de permisos en tiempo real')
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'role_updated' || data.type === 'permissions_changed') {
              console.log('Permisos actualizados en tiempo real:', data.message)
              // Refrescar permisos automáticamente
              forceRefresh()
            }
          } catch (error) {
            console.error('Error procesando evento SSE:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('Error en conexión SSE:', error)
          // Reconectar después de 5 segundos
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectToSSE()
            }
          }, 5000)
        }
      } catch (error) {
        console.error('Error conectando a SSE:', error)
      }
    }

    connectToSSE()

    // Cleanup al desmontar el componente
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [slug, isHydrated])

  // Cleanup adicional cuando cambie el slug
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [slug])

  const hasPermission = (permission: string): boolean => {
    // Para permisos granulares, siempre verificar la lista de permisos específicos
    // La lógica de administrador se maneja a nivel de módulos en el sidebar
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission))
  }

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission))
  }

  const clearCache = () => {
    if (typeof window !== 'undefined' && slug) {
      sessionStorage.removeItem(`sas-permissions-${slug}`)
      sessionStorage.removeItem(`sas-permissions-timestamp-${slug}`)
      // También limpiar cualquier caché relacionado
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('sas-permissions-')) {
          sessionStorage.removeItem(key)
        }
      })
    }
  }

  const forceRefresh = async () => {
    if (!slug) return
    
    // Limpiar caché
    clearCache()
    
    // Forzar recarga
    setIsLoading(true)
    try {
      const response = await fetch(`/api/${slug}/auth/permissions`, {
        credentials: 'include',
        cache: 'no-cache' // Forzar que no use caché del navegador
      })

      if (response.ok) {
        const data = await response.json()
        const perms = data.permissions || []
        setPermissions(perms)
        
        // Guardar en sessionStorage con timestamp
        try {
          sessionStorage.setItem(`sas-permissions-${slug}`, JSON.stringify(perms))
          sessionStorage.setItem(`sas-permissions-timestamp-${slug}`, Date.now().toString())
        } catch (error) {
          console.error('Error caching permissions:', error)
        }
      } else {
        setPermissions([])
        sessionStorage.removeItem(`sas-permissions-${slug}`)
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error)
      setPermissions([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    permissions,
    isLoading,
    hasPermissions: permissions.length > 0,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    clearCache,
    forceRefresh,
  }
}
