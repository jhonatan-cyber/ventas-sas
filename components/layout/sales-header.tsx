"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Building2, LogOut, User, Sun, Moon, Monitor, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/common/notifications-dropdown"
import { useSidebar } from "./sidebar-context"

interface SasSession {
  userId: string
  nombre?: string
  apellido?: string
  fullName?: string
  correo?: string
  rol?: string | null
  foto?: string | null
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

  const fetchUserFromAPI = async () => {
    try {
      const slug = pathname.split('/').filter(Boolean)[0]
      if (!slug) return
      
      const response = await fetch(`/api/${slug}/auth/me`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        if (userData) {
          const newSession = {
            userId: userData.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            fullName: `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || userData.correo || 'Usuario',
            correo: userData.correo,
            rol: userData.rol?.nombre || null,
            foto: userData.foto || null,
            customerSlug: slug,
            customerId: userData.organizationId || '',
            sucursalId: userData.sucursalId || null,
          }
          setSession(newSession)
          
          // Actualizar la cookie de sesión con la nueva información
          const sessionData = {
            ...newSession,
            organizationSlug: slug,
          }
          const sessionEncoded = btoa(JSON.stringify(sessionData))
          setCookie('sas-session', sessionEncoded)
        }
      }
    } catch (error) {
      console.error('Error obteniendo usuario desde API:', error)
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      try {
        const raw = getCookie('sas-session')
        if (raw) {
          // La sesión está codificada en base64
          try {
            // Decodificar base64 en el navegador usando atob
            const decoded = atob(raw)
            const parsed = JSON.parse(decoded)
            // Normalizar customerSlug (puede venir como organizationSlug)
            if (parsed.organizationSlug && !parsed.customerSlug) {
              parsed.customerSlug = parsed.organizationSlug
            }
            setSession(parsed)
          } catch {
            // Si falla el parseo base64, intentar como JSON directo (para compatibilidad)
            try {
              const parsed = JSON.parse(decodeURIComponent(raw))
              // Normalizar customerSlug
              if (parsed.organizationSlug && !parsed.customerSlug) {
                parsed.customerSlug = parsed.organizationSlug
              }
              setSession(parsed)
            } catch {
              // Si ambos fallan, intentar obtener desde la API
              await fetchUserFromAPI()
            }
          }
        } else {
          // Si no hay cookie, intentar obtener desde la API
          await fetchUserFromAPI()
        }
      } catch (error) {
        console.error('Error cargando sesión:', error)
        // Intentar obtener desde la API como fallback
        await fetchUserFromAPI()
      }
      setMounted(true)
    }

    loadSession()

    // Escuchar eventos personalizados para actualizar la sesión cuando se actualice el usuario
    const handleUserUpdated = (event: CustomEvent) => {
      const updatedUser = event.detail
      if (updatedUser) {
        // Verificar si es el usuario logueado comparando con la cookie de sesión
        const currentSession = getCookie('sas-session')
        if (currentSession) {
          try {
            const decoded = atob(currentSession)
            const parsed = JSON.parse(decoded)
            if (parsed.userId === updatedUser.id) {
              // Si el usuario actualizado es el usuario logueado, refrescar la sesión
              fetchUserFromAPI()
            }
          } catch {
            // Si no se puede parsear, intentar refrescar de todas formas
            fetchUserFromAPI()
          }
        }
      }
    }

    window.addEventListener('sas-user-updated', handleUserUpdated as EventListener)
    
    // Escuchar cambios en storage (por si se actualiza desde otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sas-user-updated') {
        fetchUserFromAPI()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('sas-user-updated', handleUserUpdated as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [pathname])

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

  const { toggle } = useSidebar()

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-30 lg:bg-white lg:dark:bg-[#1a1a1a] lg:border-b lg:border-gray-200 lg:dark:border-[#2a2a2a]">
      {/* Header flotante en móvil */}
      <div className="lg:hidden fixed top-4 left-4 right-4 h-14 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-[#2a2a2a]/50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            {/* Botón hamburguesa para móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={toggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="text-sm">{session?.customerSlug || 'SAS'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <NotificationsDropdown system="sas" slug={slug} />
            {/* Toggle de tema */}
            {mounted && (
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
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <Avatar className="w-7 h-7">
                  {session?.foto && <AvatarImage src={session.foto} alt={fullName} />}
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
      </div>
      
      {/* Header normal en desktop */}
      <div className="hidden lg:flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>{session?.customerSlug || 'SAS'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <NotificationsDropdown system="sas" slug={slug} />
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
                {session?.foto && <AvatarImage src={session.foto} alt={fullName} />}
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
