"use client"

import { usePathname } from "next/navigation"

import { SalesHeader } from "./sales-header"
import { SalesSidebar } from "./sales-sidebar"
import { SidebarProvider } from "./sidebar-context"

import { SasPermissionsProvider } from "@/contexts/sas-permissions-context"
import type { UserPermissions } from "@/lib/services/sales/user-permissions-service"

interface SalesLayoutClientProps {
  children: React.ReactNode
  organizationSlug: string
  maxBranches?: number | null
  allowedModules?: string[]
  userPermissions?: UserPermissions
}

export function SalesLayoutClient({ children, organizationSlug, maxBranches, allowedModules = [], userPermissions }: SalesLayoutClientProps) {
  const pathname = usePathname()
  const isLoginPage = pathname.includes('/login')
  const isMaintenancePage = pathname.includes('/en-mantenimiento')
  const isSubscriptionExpiredPage = pathname.includes('/suscripcion-vencida')
  
  // Rutas conocidas del sistema de ventas que SÍ deben mostrar sidebar y header
  const salesRoutes = [
    '/dashboard',
    '/productos',
    '/categorias',
    '/clientes',
    '/cotizaciones',
    '/ventas',
    '/usuarios',
    '/roles',
    '/permisos',
    '/sucursales',
    '/gastos',
    '/cajas',
    '/reportes',
    '/analytics',
    '/configuracion',
    '/inventario',
    '/support',
    '/perfil',
  ]
  
  // Verificar si es una ruta de página CMS o blog
  // Las rutas CMS tienen formato: /[slug] (landing), /[slug]/[page-slug] o /[slug]/blog/[post-slug]
  // Si no es una ruta conocida del sistema de ventas y no es login/mantenimiento, es probablemente una página CMS
  const pathSegments = pathname.split("/").filter(Boolean) // Filtrar segmentos vacíos
  const isCmsPage = !salesRoutes.some(route => pathname.includes(route)) && 
                    !isLoginPage && 
                    !isMaintenancePage && 
                    !isSubscriptionExpiredPage &&
                    (pathSegments.length === 1 || // Landing page: /[slug]
                     pathSegments.length === 2 || // Página CMS: /[slug]/[page-slug]
                     (pathSegments.length === 3 && pathSegments[1] === 'blog')) // Post blog: /[slug]/blog/[post-slug]
  
  // Si es página de login, mantenimiento, suscripción vencida o CMS, no mostrar sidebar ni header
  if (isLoginPage || isMaintenancePage || isSubscriptionExpiredPage || isCmsPage) {
    return <>{children}</>
  }
  
  return (
    <SasPermissionsProvider organizationSlug={organizationSlug}>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-[#1a1a1a]">
          <SalesSidebar 
            organizationSlug={organizationSlug} 
            maxBranches={maxBranches} 
            allowedModules={allowedModules}
            userPermissions={userPermissions}
          />
          <main className="flex-1 lg:ml-64 overflow-y-auto">
            <SalesHeader />
            <div className="mt-24 lg:mt-16">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </SasPermissionsProvider>
  )
}

