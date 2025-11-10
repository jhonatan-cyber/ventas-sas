"use client"

import { Search, User, Building2, CreditCard, Ticket, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: 'user' | 'organization' | 'subscription' | 'ticket' | 'log'
  title: string
  description: string
  url: string
  metadata?: Record<string, any>
}

const typeIcons = {
  user: User,
  organization: Building2,
  subscription: CreditCard,
  ticket: Ticket,
  log: FileText,
}

const typeLabels = {
  user: 'Usuario',
  organization: 'Organización',
  subscription: 'Suscripción',
  ticket: 'Ticket',
  log: 'Log',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Atajo de teclado Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery("")
        setResults([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus en el input cuando se abre
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Buscar cuando cambia el query
  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/administracion/search?q=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        if (data.success) {
          setResults(data.results)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce

    return () => clearTimeout(timeoutId)
  }, [query, open])

  // Navegar con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelectResult(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar usuarios, organizaciones, tickets..."
          className="pl-10 pr-10 h-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-auto">
          <div className="p-2">
            {results.map((result, index) => {
              const Icon = typeIcons[result.type]
              return (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors",
                    index === selectedIndex && "bg-gray-100 dark:bg-[#2a2a2a]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {typeLabels[result.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50">
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron resultados
          </div>
        </Card>
      )}
    </div>
  )
}
