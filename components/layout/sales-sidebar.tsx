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
  TrendingUp,
  FileText,
  ShoppingCart,
  Banknote,
  BarChart3,
  Receipt,
  DollarSign,
  Building2,
  LogOut
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface SalesSidebarProps {
  organizationSlug: string
}

export function SalesSidebar({ organizationSlug }: SalesSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    { title: "Dashboard", href: `/${organizationSlug}/dashboard`, icon: LayoutDashboard },
    { title: "Roles", href: `/${organizationSlug}/roles`, icon: Users },
    { title: "Permisos", href: `/${organizationSlug}/permisos`, icon: FileText },
    { title: "Usuarios", href: `/${organizationSlug}/usuarios`, icon: Users },
    { title: "Clientes", href: `/${organizationSlug}/clientes`, icon: Users },
    { title: "Categorías", href: `/${organizationSlug}/categorias`, icon: ShoppingBag },
    { title: "Productos", href: `/${organizationSlug}/productos`, icon: ShoppingBag },
    { title: "Ventas", href: `/${organizationSlug}/ventas`, icon: ShoppingCart },
    { title: "Cajas", href: `/${organizationSlug}/cajas`, icon: Banknote },
    { title: "Reportes", href: `/${organizationSlug}/reportes`, icon: BarChart3 },
    { title: "Cotizaciones", href: `/${organizationSlug}/cotizaciones`, icon: Receipt },
    { title: "Gastos", href: `/${organizationSlug}/gastos`, icon: DollarSign },
    { title: "Sucursales", href: `/${organizationSlug}/sucursales`, icon: Building2 },
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
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-green-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white"
                    )}
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
        </nav>

        {/* Botón de logout */}
        <div className="p-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}

