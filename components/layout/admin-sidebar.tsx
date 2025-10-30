"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Shield,
  CreditCard,
  UserCog,
  Settings,
  UserCircle,
  Receipt
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      { title: "Dashboard", href: "/administracion/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { title: "Usuarios", href: "/administracion/users", icon: Users },
      { title: "Planes", href: "/administracion/plans", icon: CreditCard },
      { title: "Suscripciones", href: "/administracion/subscriptions", icon: Receipt },
      { title: "Roles", href: "/administracion/roles", icon: Shield }
    ]
  },
  {
    title: "VENTAS",
    items: [
      { title: "Clientes", href: "/administracion/customers", icon: UserCircle }
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { title: "Configuración", href: "/administracion/setup", icon: Settings }
    ]
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#2a2a2a]">
      <div className="flex flex-col h-full">
        {/* Logo y título */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">SalesHub</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sistema Ventas SAS</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                {section.title}
              </h2>
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
                          isActive
                            ? "bg-blue-600 text-white"
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
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
