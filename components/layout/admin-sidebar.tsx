"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Receipt,
  FileText,
  DollarSign,
  Bell,
  HelpCircle,
  Download,
  Activity,
  Database,
  Palette,
  BookOpen,
  MessageSquare,
  GitBranch,
  FlaskConical,
  Building2
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
      { title: "Facturación y Pagos", href: "/administracion/billing", icon: DollarSign },
      { title: "Roles", href: "/administracion/roles", icon: Shield }
    ]
  },
  {
    title: "VENTAS",
    items: [
      { title: "Clientes", href: "/administracion/customers", icon: UserCircle },
      { title: "Empresas", href: "/administracion/customer-organizations", icon: Building2 }
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { title: "Configuración", href: "/administracion/setup", icon: Settings },
      { title: "Logs y Auditoría", href: "/administracion/logs", icon: FileText },
      { title: "Notificaciones Masivas", href: "/administracion/notifications", icon: Bell },
      { title: "Tickets de Soporte", href: "/administracion/support", icon: HelpCircle },
      { title: "Exportación de Datos", href: "/administracion/export", icon: Download },
      { title: "Salud del Sistema", href: "/administracion/health", icon: Activity },
      { title: "Gestión de Caché", href: "/administracion/cache", icon: Database },
      { title: "White Label", href: "/administracion/white-label", icon: Palette },
      { title: "CMS", href: "/administracion/cms", icon: BookOpen },
      { title: "Feedback", href: "/administracion/feedback", icon: MessageSquare },
      { title: "Versiones", href: "/administracion/versions", icon: GitBranch },
      { title: "Pruebas A/B", href: "/administracion/ab-tests", icon: FlaskConical },
      { title: "Dominios", href: "/administracion/custom-domains", icon: Database },
      { title: "Integraciones", href: "/administracion/integrations", icon: Download }
    ]
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, close, isCollapsed, toggleCollapse } = useSidebar()

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
        "fixed left-0 top-0 h-full bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#2a2a2a] z-50 transition-all duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo y título */}
          <div className={cn(
            "flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a] transition-all relative",
            isCollapsed ? "p-2" : "p-6"
          )}>
            <div className={cn(
              "flex items-center gap-3 transition-all",
              isCollapsed && "justify-center w-full"
            )}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">SalesHub</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sistema Ventas SAS</p>
                </div>
              )}
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
            {/* Botón colapsar en desktop */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex"
                    onClick={toggleCollapse}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4">
          <TooltipProvider>
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                {!isCollapsed && (
                  <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider transition-opacity duration-300">
                    {section.title}
                  </h2>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    
                    const linkContent = (
                      <Link
                        href={item.href}
                        onClick={() => close()}
                        className={cn(
                          "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                          isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        )} />
                        {!isCollapsed && (
                          <span className="transition-opacity duration-300 whitespace-nowrap">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    )

                    return (
                      <li key={item.href}>
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </TooltipProvider>
        </nav>
        </div>
      </aside>
    </>
  )
}
