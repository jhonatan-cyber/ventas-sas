"use client"

import { usePathname } from 'next/navigation'
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'

interface SasPermissionsContextType {
  permissions: string[]
  isLoading: boolean
  refreshPermissions: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
  userId?: string
  roleName?: string
}

const SasPermissionsContext = createContext<SasPermissionsContextType>({
  permissions: [],
  isLoading: true,
  refreshPermissions: async () => {},
  hasPermission: () => false,
  isAdmin: false,
  userId: undefined,
  roleName: undefined,
})

interface SasPermissionsProviderProps {
  children: ReactNode
  organizationSlug: string
}

export function SasPermissionsProvider({ children, organizationSlug }: SasPermissionsProviderProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | undefined>()
  const [roleName, setRoleName] = useState<string | undefined>()
  const pathname = usePathname()
  const hasInitialized = useRef(false)

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/${organizationSlug}/auth/permissions`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
        setIsAdmin(data.isAdmin || false)
        setUserId(data.userId)
        setRoleName(data.roleName)
        
        // Debug temporal para verificar detección de admin
        if (data.isAdmin) {
          console.log('✅ Usuario administrador detectado:', {
            roleName: data.roleName,
            isAdmin: data.isAdmin,
            userId: data.userId
          })
        }
      } else {
        setPermissions([])
        setIsAdmin(false)
        setUserId(undefined)
        setRoleName(undefined)
      }
    } catch (error) {
      console.error('Error fetching SAS permissions:', error)
      setPermissions([])
      setIsAdmin(false)
      setUserId(undefined)
      setRoleName(undefined)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPermissions = async () => {
    setIsLoading(true)
    await fetchPermissions()
  }

  const hasPermission = (permission: string): boolean => {
    // ADMINISTRADOR: Control total sin restricciones
    if (isAdmin) {
      return true
    }

    // Usuario regular: verificar permisos específicos
    return permissions.includes(permission)
  }

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Solo cargar permisos si estamos en páginas del sistema SAS
    if (pathname.includes('/dashboard') || 
        pathname.includes('/productos') || 
        pathname.includes('/categorias') ||
        pathname.includes('/clientes') ||
        pathname.includes('/cotizaciones') ||
        pathname.includes('/ventas') ||
        pathname.includes('/usuarios') ||
        pathname.includes('/roles') ||
        pathname.includes('/permisos') ||
        pathname.includes('/sucursales') ||
        pathname.includes('/gastos') ||
        pathname.includes('/cajas') ||
        pathname.includes('/reportes') ||
        pathname.includes('/analytics') ||
        pathname.includes('/configuracion') ||
        pathname.includes('/inventario') ||
        pathname.includes('/support') ||
        pathname.includes('/perfil')) {
      fetchPermissions()
    } else {
      setIsLoading(false)
    }
  }, [organizationSlug])

  return (
    <SasPermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        refreshPermissions,
        hasPermission,
        isAdmin,
        userId,
        roleName,
      }}
    >
      {children}
    </SasPermissionsContext.Provider>
  )
}

export function useSasPermissions() {
  return useContext(SasPermissionsContext)
}