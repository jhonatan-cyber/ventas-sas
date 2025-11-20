"use client"

import { X } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  ShoppingCart,
  Banknote,
  BarChart3,
  Receipt,
  DollarSign,
  Building2,
  Settings,
  Package,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useSidebar } from "./sidebar-context"

import type { CSSProperties, ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { getSasRouteToModuleMap } from "@/lib/config/sas-modules"
import { cn } from "@/lib/utils"




interface NavItem { title: string; href: string; icon: ComponentType<{ className?: string }>; }
interface NavSection { label: string; items: NavItem[] }

interface SalesSidebarProps {
  organizationSlug: string
  maxBranches?: number | null
  allowedModules?: string[]
}

export function SalesSidebar({ organizationSlug, maxBranches, allowedModules = [] }: SalesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()
  const t = useTranslations()
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)

  // Cargar información de la organización desde la API
  useEffect(() => {
    const loadOrganizationInfo = async () => {
      try {
        // Cargar información de la organización desde la BD
        const orgResponse = await fetch(`/api/${organizationSlug}/organizacion`, {
          credentials: 'include'
        })
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          if (orgData.success && orgData.organization) {
            const org = orgData.organization
            // Usar razonSocial si existe, sino usar name
            setCompanyName(org.razonSocial || org.name || null)
            setCompanyLogo(org.logoUrl || null)
          }
        }
      } catch (error) {
        // Silenciar errores de red para evitar ruido en la consola
        // El error "Failed to fetch" puede ocurrir durante desarrollo o si el servidor no está disponible
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          // Error de red, no hacer nada para evitar spam en consola
        } else {
          console.error('Error cargando información de organización:', error)
        }
      }

      // Leer plan de cookies (temporal, hasta migrar a BD)
      try {
        const planRaw = document.cookie.split('; ').find(c => c.startsWith(`sas-plan-${organizationSlug}=`))?.split('=')[1]
        if (planRaw) {
          setPlanName(decodeURIComponent(planRaw))
        }
      } catch {}
    }

    loadOrganizationInfo()

    // Escuchar cambios en las preferencias (cuando se actualiza desde configuración)
    const handleStorageChange = () => {
      loadOrganizationInfo()
    }

    // Escuchar eventos personalizados cuando se actualiza el logo o nombre
    const handleOrganizationUpdate = () => {
      loadOrganizationInfo()
    }

    window.addEventListener('companyLogoUpdated', handleStorageChange)
    window.addEventListener('companyInfoUpdated', handleStorageChange)
    window.addEventListener('organization-updated', handleOrganizationUpdate)
    
    // También verificar periódicamente (por si se actualiza desde otra pestaña)
    const interval = setInterval(loadOrganizationInfo, 5000) // Verificar cada 5 segundos

    return () => {
      window.removeEventListener('companyLogoUpdated', handleStorageChange)
      window.removeEventListener('companyInfoUpdated', handleStorageChange)
      window.removeEventListener('organization-updated', handleOrganizationUpdate)
      clearInterval(interval)
    }
  }, [organizationSlug])

  // Mapeo de rutas a IDs de módulos (obtenido de la configuración centralizada)
  const routeToModuleMap = getSasRouteToModuleMap()

  // Función para verificar si un módulo está permitido
  const isModuleAllowed = (route: string): boolean => {
    // Si no hay módulos definidos en el plan, mostrar todos (comportamiento por defecto)
    if (allowedModules.length === 0) {
      return true
    }
    
    const moduleId = routeToModuleMap[route]
    if (!moduleId) {
      // Si la ruta no está mapeada, permitirla por defecto
      return true
    }
    
    return allowedModules.includes(moduleId)
  }

  const sections: NavSection[] = [
    {
      label: t('sidebar.home'),
      items: [
        { title: t('nav.dashboard'), href: `/${organizationSlug}/dashboard`, icon: LayoutDashboard },
      ].filter(item => {
        const route = item.href.split('/').pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: t('sidebar.operation'),
      items: [
        { title: t('nav.sales'), href: `/${organizationSlug}/ventas`, icon: ShoppingCart },
        { title: t('nav.cashRegisters'), href: `/${organizationSlug}/cajas`, icon: Banknote },
        { title: t('nav.quotations'), href: `/${organizationSlug}/cotizaciones`, icon: Receipt },
        { title: t('nav.expenses'), href: `/${organizationSlug}/gastos`, icon: DollarSign },
      ].filter(item => {
        const route = item.href.split('/').pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: t('sidebar.catalog'),
      items: [
        { title: t('nav.products'), href: `/${organizationSlug}/productos`, icon: ShoppingBag },
        { title: t('nav.categories'), href: `/${organizationSlug}/categorias`, icon: ShoppingBag },
        { title: t('nav.customers'), href: `/${organizationSlug}/clientes`, icon: Users },
        // Inventario avanzado: solo visible si el plan permite más de 1 sucursal
        ...(maxBranches && maxBranches > 1 ? [{ title: t('nav.inventory') || 'Inventario', href: `/${organizationSlug}/inventario`, icon: Package }] : []),
      ].filter(item => {
        const route = item.href.split('/').pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: t('sidebar.management'),
      items: [
        { title: t('nav.users'), href: `/${organizationSlug}/usuarios`, icon: Users },
        { title: t('nav.roles'), href: `/${organizationSlug}/roles`, icon: Users },
        { title: t('nav.permissions'), href: `/${organizationSlug}/permisos`, icon: FileText },
        // Ocultar Sucursales si maxBranches === 1
        ...(maxBranches !== 1 ? [{ title: t('nav.branches'), href: `/${organizationSlug}/sucursales`, icon: Building2 }] : []),
        { title: t('nav.configuration'), href: `/${organizationSlug}/configuracion`, icon: Settings },
      ].filter(item => {
        const route = item.href.split('/').pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: t('sidebar.reports'),
      items: [
        { title: t('nav.reports'), href: `/${organizationSlug}/reportes`, icon: BarChart3 },
        { title: t('nav.analytics') || 'Analytics', href: `/${organizationSlug}/analytics`, icon: TrendingUp },
      ].filter(item => {
        const route = item.href.split('/').pop() || ''
        return isModuleAllowed(route)
      }),
    },
  ].filter(section => section.items.length > 0) // Filtrar secciones vacías

  const _handleLogout = async () => {
    try {
      const response = await fetch(`/api/${organizationSlug}/logout`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Sesión cerrada correctamente")
        router.push(`/${organizationSlug}/login`)
        router.refresh()
      } else {
        toast.error("Error al cerrar sesión")
      }
    } catch {
      toast.error("Error al cerrar sesión")
    }
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#2a2a2a] z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo y título */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-transparent">
                  <Image
                    src={companyLogo}
                    alt="Logo empresa"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {companyName || t('app.systemName')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {planName || organizationSlug}
                </p>
              </div>
            </div>
            {/* Botón cerrar en móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {section.label}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                  <Link
                        href={item.href}
                        onClick={() => close()}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      !isActive && "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white"
                        )}
                    style={isActive ? ({ background: 'var(--primary)', color: 'var(--primary-foreground)' } as CSSProperties) : undefined}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                      isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        )} />
                        {item.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer espacio */}
        <div className="p-3 border-t border-transparent" />
        </div>
      </aside>
    </>
  )
}

