"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Building2, LogOut, User, Sun, Moon, Monitor, Bell } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SasSession {
  userId: string
  nombre?: string
  apellido?: string
  fullName?: string
  correo?: string
  rol?: string | null
  customerSlug: string
  customerId: string
  sucursalId?: string | null
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Expires=${expires}${isProduction ? '; Secure' : ''}`
}

export function SalesHeader() {
  const pathname = usePathname()
  const [session, setSession] = useState<SasSession | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = getCookie('sas-session')
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw))
        setSession(parsed)
      }
    } catch {}
    setMounted(true)
  }, [])

  const fullName = session?.fullName || `${session?.nombre || ''} ${session?.apellido || ''}`.trim() || 'Usuario'
  const slug = session?.customerSlug || pathname.split('/').filter(Boolean)[0]

  useEffect(() => {
    // Al montar, leer el tema por cliente desde cookie y aplicarlo
    const key = slug ? `sas-theme-${slug}` : 'sas-theme'
    const saved = getCookie(key)
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      setTheme(saved)
    }
    // Cargar color del sistema desde preferencias
    if (slug) {
      const prefsRaw = getCookie(`sas-prefs-${slug}`)
      if (prefsRaw) {
        try {
          const prefs = JSON.parse(decodeURIComponent(prefsRaw))
          const color = prefs.themeColor || 'green'
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-sas-color', color)
          }
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const applyTheme = (value: 'light' | 'dark' | 'system') => {
    setTheme(value)
    const key = slug ? `sas-theme-${slug}` : 'sas-theme'
    setCookie(key, value)
  }

  const handleLogout = async () => {
    const slug = session?.customerSlug || pathname.split('/').filter(Boolean)[0]
    try {
      await fetch(`/${slug ? 'api/' + slug + '/logout' : '/api/logout'}`, { method: 'POST' })
    } catch {}
    window.location.href = `/${slug}/login`
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] z-40">
      <div className="flex items-center justify-between h-full px-6">
        <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <span>{session?.customerSlug || 'SAS'}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            title="Notificaciones"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          {/* Toggle de tema */}
          {mounted && (
            <div className="relative group">
              <button
                onClick={() => {
                  const current = theme || 'system'
                  if (current === 'light') applyTheme('dark')
                  else if (current === 'dark') applyTheme('system')
                  else applyTheme('light')
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                title="Tema"
              >
                {theme === 'light' ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-1">
                  <button onClick={() => applyTheme('light')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-sm ${theme==='light'?'font-semibold':''}`}> 
                    <Sun className="inline h-4 w-4 mr-2" /> Claro
                  </button>
                  <button onClick={() => applyTheme('dark')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-sm ${theme==='dark'?'font-semibold':''}`}>
                    <Moon className="inline h-4 w-4 mr-2" /> Oscuro
                  </button>
                  <button onClick={() => applyTheme('system')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-sm ${theme==='system'?'font-semibold':''}`}>
                    <Monitor className="inline h-4 w-4 mr-2" /> Sistema
                  </button>
                </div>
              </div>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-sm text-gray-900 dark:text-white">{fullName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{session?.rol || 'Usuario'}</span>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' } as React.CSSProperties}>
                  {(fullName || 'U').slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { const slug = session?.customerSlug || pathname.split('/').filter(Boolean)[0]; window.location.href = `/${slug}/perfil` }}>Perfil</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}


