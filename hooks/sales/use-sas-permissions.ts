"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export interface SasUserPermissions {
  permissions: string[]
  isLoading: boolean
  hasPermissions: boolean // Indica si el usuario tiene permisos definidos
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  clearCache: () => void
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

  // Efecto para hidratación del cliente
  useEffect(() => {
    setIsHydrated(true)
    
    if (!slug) {
      setIsLoading(false)
      return
    }

    // Intentar cargar desde caché primero
    try {
      const cached = sessionStorage.getItem(`sas-permissions-${slug}`)
      if (cached) {
        const cachedPermissions = JSON.parse(cached)
        setPermissions(cachedPermissions)
        setIsLoading(false)
        return // No hacer fetch si hay caché válido
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
          
          // Guardar en sessionStorage para próximas cargas
          try {
            sessionStorage.setItem(`sas-permissions-${slug}`, JSON.stringify(perms))
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

  const hasPermission = (permission: string): boolean => {
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
  }
}
