"use client"

import { Moon, Sun, Monitor, HelpCircle, LogOut, User, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { useSidebar } from "./sidebar-context"

import { GlobalSearch } from "@/components/admin/global-search"
import { NotificationsDropdown } from "@/components/common/notifications-dropdown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: string
  isSuperAdmin: boolean
  isActive: boolean
  photo?: string | null
}

export function AdminHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const { toggle } = useSidebar()

  useEffect(() => {
    setMounted(true)
    
    const loadUser = async () => {
      try {
        const res = await fetch('/api/administracion/me', {
          credentials: 'include'
        })
        const data = await res.json()
        if (data.id) {
          setUser(data)
        }
      } catch {
        // Si falla, no mostrar error, solo dejar valores por defecto
      }
    }
    
    loadUser()
    
    // Recargar usuario cuando se actualice el perfil
    const handleProfileUpdate = () => {
      loadUser()
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  if (!mounted) {
    return null
  }

  const currentTheme = theme || 'system'

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-30 lg:bg-white lg:dark:bg-[#1a1a1a] lg:border-b lg:border-gray-200 lg:dark:border-[#2a2a2a]">
      {/* Header flotante en móvil */}
      <div className="lg:hidden fixed top-4 left-4 right-4 h-14 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-[#2a2a2a]/50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Botón hamburguesa para móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo en móvil */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">SmartPOS</span>
          </div>
          
          {/* Acciones en móvil */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <NotificationsDropdown system="admin" />
            
            {/* Toggle de tema */}
            <button 
              onClick={() => {
                if (currentTheme === 'light') setTheme('dark')
                else if (currentTheme === 'dark') setTheme('system')
                else setTheme('light')
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {currentTheme === 'light' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : currentTheme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {/* Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.photo || undefined} alt={user?.fullName || user?.email || 'Usuario'} />
                  <AvatarFallback>
                    {(user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cuenta
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { window.location.href = '/administracion/perfil' }}>
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await fetch('/api/administracion/logout', { method: 'POST', credentials: 'include' })
                      // Limpiar caché de permisos
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('admin-permissions-cache')
                        sessionStorage.removeItem('admin-permissions-cache-timestamp')
                      }
                    } catch {}
                    window.location.href = '/administracion/login'
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Header normal en desktop */}
      <div className="hidden lg:flex items-center justify-between h-full px-6">
        {/* Botón hamburguesa para móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Búsqueda global - oculta en móvil */}
        <div className="hidden md:flex flex-1 max-w-md">
          <GlobalSearch />
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <NotificationsDropdown system="admin" />

          {/* Toggle de tema */}
          <div className="relative group">
            <button 
              onClick={() => {
                if (currentTheme === 'light') setTheme('dark')
                else if (currentTheme === 'dark') setTheme('system')
                else setTheme('light')
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {currentTheme === 'light' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : currentTheme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-sm ${
                    currentTheme === 'light' ? 'font-semibold' : ''
                  }`}
                >
                  <Sun className="inline h-4 w-4 mr-2" />
                  Claro
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-sm ${
                    currentTheme === 'dark' ? 'font-semibold' : ''
                  }`}
                >
                  <Moon className="inline h-4 w-4 mr-2" />
                  Oscuro
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-sm ${
                    currentTheme === 'system' ? 'font-semibold' : ''
                  }`}
                >
                  <Monitor className="inline h-4 w-4 mr-2" />
                  Sistema
                </button>
              </div>
            </div>
          </div>

          {/* Ayuda */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
            <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

        {/* Usuario */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-[#2a2a2a]">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.photo || undefined} alt={user?.fullName || user?.email || 'Usuario'} />
                <AvatarFallback>
                  {(user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.isSuperAdmin ? 'Super Administrador' : user?.role || 'Usuario'}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cuenta
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { window.location.href = '/administracion/perfil' }}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await fetch('/api/administracion/logout', { method: 'POST', credentials: 'include' })
                  } catch {}
                  window.location.href = '/administracion/login'
                }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>
    </header>
  )
}
