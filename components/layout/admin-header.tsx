"use client"

import { Bell, Moon, Sun, Monitor, HelpCircle, Search } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function AdminHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const currentTheme = theme || 'system'

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
              ⌘K
            </div>
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">SA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Super Administrador</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">super_administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
