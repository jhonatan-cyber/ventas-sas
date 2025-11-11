"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface PermissionsContextType {
  permissions: string[]
  isSuperAdmin: boolean
  isLoading: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  isSuperAdmin: false,
  isLoading: true,
  refreshPermissions: async () => {},
})

const PERMISSIONS_CACHE_KEY = 'admin-permissions-cache'
const PERMISSIONS_CACHE_TIMESTAMP_KEY = 'admin-permissions-cache-timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface PermissionsCache {
  permissions: string[]
  isSuperAdmin: boolean
  timestamp: number
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadPermissionsFromCache = (): PermissionsCache | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = sessionStorage.getItem(PERMISSIONS_CACHE_KEY)
      const timestamp = sessionStorage.getItem(PERMISSIONS_CACHE_TIMESTAMP_KEY)
      
      if (cached && timestamp) {
        const cacheData: PermissionsCache = JSON.parse(cached)
        const cacheTime = parseInt(timestamp, 10)
        const now = Date.now()
        
        // Si el caché es válido (menos de 5 minutos)
        if (now - cacheTime < CACHE_DURATION) {
          return cacheData
        }
      }
    } catch (error) {
      console.error('Error loading permissions from cache:', error)
    }
    
    return null
  }

  const savePermissionsToCache = (data: PermissionsCache) => {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(data))
      sessionStorage.setItem(PERMISSIONS_CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('Error saving permissions to cache:', error)
    }
  }

  const clearPermissionsCache = () => {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.removeItem(PERMISSIONS_CACHE_KEY)
      sessionStorage.removeItem(PERMISSIONS_CACHE_TIMESTAMP_KEY)
    } catch (error) {
      console.error('Error clearing permissions cache:', error)
    }
  }

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/administracion/auth/permissions', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        const permissionsData = {
          permissions: data.permissions || [],
          isSuperAdmin: data.isSuperAdmin || false,
          timestamp: Date.now(),
        }
        
        setPermissions(permissionsData.permissions)
        setIsSuperAdmin(permissionsData.isSuperAdmin)
        savePermissionsToCache(permissionsData)
      } else {
        // Si no hay sesión, limpiar caché
        clearPermissionsCache()
        setPermissions([])
        setIsSuperAdmin(false)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      // En caso de error, intentar usar caché
      const cached = loadPermissionsFromCache()
      if (cached) {
        setPermissions(cached.permissions)
        setIsSuperAdmin(cached.isSuperAdmin)
      } else {
        setPermissions([])
        setIsSuperAdmin(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshPermissions = async () => {
    clearPermissionsCache()
    setIsLoading(true)
    await fetchPermissions()
  }

  useEffect(() => {
    // Primero intentar cargar desde caché para mostrar inmediatamente
    const cached = loadPermissionsFromCache()
    if (cached) {
      setPermissions(cached.permissions)
      setIsSuperAdmin(cached.isSuperAdmin)
      setIsLoading(false)
    }
    
    // Luego hacer fetch para actualizar
    fetchPermissions()
  }, [fetchPermissions])

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isSuperAdmin,
        isLoading,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  return useContext(PermissionsContext)
}

