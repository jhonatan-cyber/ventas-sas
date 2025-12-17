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
  TrendingUp,
  HelpCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useSidebar } from "./sidebar-context"

import type { CSSProperties, ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { useSasPermissions } from "@/contexts/sas-permissions-context"
import { getSasRouteToModuleMap } from "@/lib/config/sas-modules"
import { hasRoutePermission } from "@/lib/config/sas-permissions"
import { UserPermissions } from "@/lib/services/sales/user-permissions-service"
import { cn } from "@/lib/utils"




interface NavItem { title: string; href: string; icon: ComponentType<{ className?: string }>; }
interface NavSection { label: string; items: NavItem[] }

interface SalesSidebarProps {
  organizationSlug: string
  maxBranches?: number | null
  allowedModules?: string[]
  userPermissions?: UserPermissions
}

export function SalesSidebar({ organizationSlug, maxBranches, allowedModules = [], userPermissions }: SalesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()
  const [companyLogo, _setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)

  // Usar permisos del cliente (hook) para tener los permisos más actualizados
  const { permissions: clientPermissions, isLoading: permissionsLoading } = useSasPermissions()
  
  // Fallback a permisos del servidor si el cliente aún está cargando
  const permissions = permissionsLoading ? (userPermissions?.permissions || []) : clientPermissions

  // Cargar información de la organización y plan
  useEffect(() => {
    const loadOrganizationInfo = async () => {
      try {
        // Obtener información de la organización
        const response = await fetch(`/api/${organizationSlug}/organizacion`)
        if (response.ok) {
          const data = await response.json()
          setCompanyName(data.organization?.name || organizationSlug)

          // Obtener nombre del plan de suscripción
          if (data.subscriptionPlan?.name) {
            setPlanName(`Plan ${data.subscriptionPlan.name}`)
          } else {
            setPlanName('Plan Básico')
          }
        } else {
          // Fallback si no se puede obtener la información
          setCompanyName(organizationSlug.charAt(0).toUpperCase() + organizationSlug.slice(1))
          setPlanName('Plan Básico')
        }
      } catch (error) {
        console.error('Error cargando información de organización:', error)
        // Fallback en caso de error
        setCompanyName(organizationSlug.charAt(0).toUpperCase() + organizationSlug.slice(1))
        setPlanName('Plan Básico')
      }
    }

    loadOrganizationInfo()
  }, [organizationSlug])

  // Mapeo de rutas a IDs de módulos (obtenido de la configuración centralizada)
  const routeToModuleMap = getSasRouteToModuleMap()

  // Función para verificar si un módulo está permitido (plan + permisos)
  const isModuleAllowed = (route: string): boolean => {
    // El dashboard, soporte y perfil siempre están disponibles
    if (route === 'dashboard' || route === 'support' || route === 'perfil') {
      return true
    }

    // 1. Verificar si el módulo está permitido por el plan de suscripción
    const moduleId = routeToModuleMap[route]
    if (moduleId && allowedModules.length > 0) {
      // Si hay módulos definidos en el plan, verificar que esté incluido
      if (!allowedModules.includes(moduleId)) {
        return false // El plan no incluye este módulo
      }
    }

    // 2. Verificar permisos del usuario
    // Si el usuario es administrador, puede ver todos los módulos del plan
    const isAdmin = userPermissions?.isAdmin || false
    if (isAdmin) {
      return true // Administrador ve todos los módulos permitidos por el plan
    }

    // 3. Para usuarios regulares, verificar permisos específicos
    if (!hasRoutePermission(route, permissions)) {
      return false // No tiene permisos para este módulo
    }

    return true
  }

  const sections: NavSection[] = [
    {
      label: 'Inicio',
      items: [
        { title: 'Dashboard', href: `/${organizationSlug}/dashboard`, icon: LayoutDashboard },
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: 'Operaciones',
      items: [
        { title: 'Ventas', href: `/${organizationSlug}/ventas`, icon: ShoppingCart },
        { title: 'Cajas', href: `/${organizationSlug}/cajas`, icon: Banknote },
        { title: 'Cotizaciones', href: `/${organizationSlug}/cotizaciones`, icon: Receipt },
        { title: 'Gastos', href: `/${organizationSlug}/gastos`, icon: DollarSign },
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: 'Catálogo',
      items: [
        { title: 'Productos', href: `/${organizationSlug}/productos`, icon: ShoppingBag },
        { title: 'Categorías', href: `/${organizationSlug}/categorias`, icon: ShoppingBag },
        { title: 'Clientes', href: `/${organizationSlug}/clientes`, icon: Users },
        // Inventario avanzado: solo visible si el plan permite más de 1 sucursal
        ...(maxBranches && maxBranches > 1 ? [{ title: 'Inventario', href: `/${organizationSlug}/inventario`, icon: Package }] : []),
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: 'Administración',
      items: [
        { title: 'Usuarios', href: `/${organizationSlug}/usuarios`, icon: Users },
        { title: 'Roles', href: `/${organizationSlug}/roles`, icon: Users },
        { title: 'Permisos', href: `/${organizationSlug}/permisos`, icon: FileText },
        // Ocultar Sucursales si maxBranches === 1
        ...(maxBranches !== 1 ? [{ title: 'Sucursales', href: `/${organizationSlug}/sucursales`, icon: Building2 }] : []),
        { title: 'Configuración', href: `/${organizationSlug}/configuracion`, icon: Settings },
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: 'Reportes',
      items: [
        { title: 'Reportes', href: `/${organizationSlug}/reportes`, icon: BarChart3 },
        { title: 'Analytics', href: `/${organizationSlug}/analytics`, icon: TrendingUp },
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
    {
      label: 'Soporte',
      items: [
        { title: 'Soporte', href: `/${organizationSlug}/support`, icon: HelpCircle },
      ].filter(item => {
        const route = item.href.split("/").pop() || ''
        return isModuleAllowed(route)
      }),
    },
  ].filter(section => section.items.length > 0) // Filtrar secciones vacías

  // Si los permisos están cargando, mostrar un skeleton o loading
  if (permissionsLoading) {
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
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={close}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Loading skeleton para navegación */}
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((section) => (
                  <div key={section} className="mb-4">
                    <div className="px-3 py-2">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <ul className="space-y-1">
                      {[1, 2, 3].map((item) => (
                        <li key={item}>
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            <div className="p-3 border-t border-transparent" />
          </div>
        </aside>
      </>
    )
  }

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
                  {companyName || 'Sistema SAS'}
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

