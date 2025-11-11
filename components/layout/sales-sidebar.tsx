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
  Settings
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useSidebar } from "./sidebar-context"

import type { CSSProperties, ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"




interface NavItem { title: string; href: string; icon: ComponentType<{ className?: string }>; }
interface NavSection { label: string; items: NavItem[] }

interface SalesSidebarProps {
  organizationSlug: string
  maxBranches?: number | null
}

export function SalesSidebar({ organizationSlug, maxBranches }: SalesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  const sections: NavSection[] = [
    {
      label: 'Inicio',
      items: [
        { title: 'Dashboard', href: `/${organizationSlug}/dashboard`, icon: LayoutDashboard },
      ],
    },
    {
      label: 'Operación',
      items: [
        { title: 'Ventas', href: `/${organizationSlug}/ventas`, icon: ShoppingCart },
        { title: 'Cajas', href: `/${organizationSlug}/cajas`, icon: Banknote },
        { title: 'Cotizaciones', href: `/${organizationSlug}/cotizaciones`, icon: Receipt },
        { title: 'Gastos', href: `/${organizationSlug}/gastos`, icon: DollarSign },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        { title: 'Productos', href: `/${organizationSlug}/productos`, icon: ShoppingBag },
        { title: 'Categorías', href: `/${organizationSlug}/categorias`, icon: ShoppingBag },
        { title: 'Clientes', href: `/${organizationSlug}/clientes`, icon: Users },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { title: 'Usuarios', href: `/${organizationSlug}/usuarios`, icon: Users },
        { title: 'Roles', href: `/${organizationSlug}/roles`, icon: Users },
        { title: 'Permisos', href: `/${organizationSlug}/permisos`, icon: FileText },
        // Ocultar Sucursales si maxBranches === 1
        ...(maxBranches !== 1 ? [{ title: 'Sucursales', href: `/${organizationSlug}/sucursales`, icon: Building2 }] : []),
        { title: 'Configuración', href: `/${organizationSlug}/configuracion`, icon: Settings },
      ],
    },
    {
      label: 'Reportes',
      items: [
        { title: 'Reportes', href: `/${organizationSlug}/reportes`, icon: BarChart3 },
      ],
    },
  ]

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
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sistema Ventas</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{organizationSlug}</p>
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

