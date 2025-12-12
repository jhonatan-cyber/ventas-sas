"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LoginThemeSelector() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-white/20 dark:border-slate-600/50 backdrop-blur-sm transition-all duration-200"
      >
        <Sun className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </Button>
    )
  }

  const getCurrentIcon = () => {
    const iconClass = "h-4 w-4 text-slate-600 dark:text-slate-300"
    if (theme === "dark") return <Moon className={iconClass} />
    if (theme === "system") return <Monitor className={iconClass} />
    return <Sun className={iconClass} />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-white/20 dark:border-slate-600/50 backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {getCurrentIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-44 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-slate-700/50 shadow-2xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span className="font-medium">Claro</span>
          {theme === "light" && (
            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span className="font-medium">Oscuro</span>
          {theme === "dark" && (
            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <Monitor className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Sistema</span>
          {theme === "system" && (
            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}