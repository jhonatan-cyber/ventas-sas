"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
  LogOut
} from "lucide-react"

interface NavItem { title: string; href: string; icon: React.ComponentType<{ className?: string }>; }
interface NavSection { label: string; items: NavItem[] }

interface SalesSidebarProps {
  organizationSlug: string
}

export function SalesSidebar({ organizationSlug }: SalesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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
        { title: 'Sucursales', href: `/${organizationSlug}/sucursales`, icon: Building2 },
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

  const handleLogout = async () => {
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
    } catch (error) {
      toast.error("Error al cerrar sesión")
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#2a2a2a]">
      <div className="flex flex-col h-full">
        {/* Logo y título */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sistema Ventas</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{organizationSlug}</p>
          </div>
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
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      !isActive && "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white"
                        )}
                    style={isActive ? ({ background: 'var(--primary)', color: 'var(--primary-foreground)' } as React.CSSProperties) : undefined}
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
  )
}

