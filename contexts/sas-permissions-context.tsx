"use client"

import { usePathname } from 'next/navigation'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'

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

// Flag global para evitar múltiples inicializaciones
let isInitializing = false
let hasInitialized = false

export function SasPermissionsProvider({ children, organizationSlug }: SasPermissionsProviderProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | undefined>()
  const [roleName, setRoleName] = useState<string | undefined>()
  const pathname = usePathname()
  const initRef = useRef(false)

  const fetchPermissions = useCallback(async () => {
    if (isInitializing || hasInitialized) return
    
    isInitializing = true
    
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
      isInitializing = false
      hasInitialized = true
    }
  }, [organizationSlug])

  const refreshPermissions = async () => {
    hasInitialized = false
    setIsLoading(true)
    await fetchPermissions()
  }

  const hasPermission = (permission: string): boolean => {
    // Si el usuario es administrador, otorgar acceso completo
    if (isAdmin) return true

    return permissions.includes(permission)
  }

  useEffect(() => {
    // Evitar múltiples inicializaciones usando ref
    if (initRef.current) return
    initRef.current = true

    // Solo cargar permisos si no estamos en páginas públicas
    const isPublicPage = pathname.includes('/login') || 
                        pathname.includes('/en-mantenimiento') || 
                        pathname.includes('/suscripcion-vencida') ||
                        pathname.includes('/forgot-password') ||
                        pathname.includes('/reset-password')
    
    // Verificar si es una página CMS/pública
    const pathSegments = pathname.split("/").filter(Boolean)
    const salesRoutes = [
      'dashboard', 'productos', 'categorias', 'clientes', 'cotizaciones', 'ventas',
      'usuarios', 'roles', 'permisos', 'sucursales', 'gastos', 'cajas', 'reportes',
      'analytics', 'configuracion', 'inventario', 'support', 'perfil'
    ]
    const isCmsPage = !salesRoutes.some(route => pathname.includes(`/${route}`)) && 
                      !isPublicPage &&
                      (pathSegments.length === 1 || // Landing page: /[slug]
                       pathSegments.length === 2 || // Página CMS: /[slug]/[page-slug]
                       (pathSegments.length === 3 && pathSegments[1] === 'blog')) // Post blog: /[slug]/blog/[post-slug]

    if (isPublicPage || isCmsPage) {
      setIsLoading(false)
      return
    }

    // Cargar permisos solo una vez
    fetchPermissions()
  }, [fetchPermissions, pathname]) // Incluir dependencias requeridas

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