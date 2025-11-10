"use client"

import { Database, Trash2, RefreshCw, TrendingUp, Key, HardDrive } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface CacheStats {
  hits: number
  misses: number
  keys: number
  hitRate: number
  size: number
}

export function CacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)
  const [purgePattern, setPurgePattern] = useState("")
  const [purgeAllOpen, setPurgeAllOpen] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/administracion/cache/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del caché",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Actualizar cada 10 segundos
    return () => clearInterval(interval)
  }, [])

  const handlePurgePattern = async () => {
    if (!purgePattern.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un patrón válido",
        variant: "destructive",
      })
      return
    }

    setPurging(true)
    try {
      const response = await fetch('/api/administracion/cache/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern: purgePattern }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Éxito",
          description: data.message,
        })
        setPurgePattern("")
        fetchStats()
      } else {
        throw new Error(data.error || 'Error al purgar')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al purgar el caché",
        variant: "destructive",
      })
    } finally {
      setPurging(false)
    }
  }

  const handlePurgeAll = async () => {
    setPurging(true)
    try {
      const response = await fetch('/api/administracion/cache/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Éxito",
          description: data.message,
        })
        setPurgeAllOpen(false)
        fetchStats()
      } else {
        throw new Error(data.error || 'Error al purgar')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al purgar el caché",
        variant: "destructive",
      })
    } finally {
      setPurging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No se pudieron cargar las estadísticas
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Caché</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra el caché del sistema
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.hitRate.toFixed(2)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.hits} hits / {stats.misses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.hits.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aciertos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Misses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.misses.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fallos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Claves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.keys}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">En caché</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Tamaño
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.size.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Purga */}
      <Card>
        <CardHeader>
          <CardTitle>Purgar Caché</CardTitle>
          <CardDescription>
            Elimina claves del caché por patrón o limpia todo el caché
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Purgar por Patrón (Regex)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: admin:organizations:*"
                value={purgePattern}
                onChange={(e) => setPurgePattern(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePurgePattern()
                  }
                }}
              />
              <Button
                onClick={handlePurgePattern}
                disabled={!purgePattern.trim() || purging}
                variant="outline"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Purgar
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ejemplos: <code>admin:organizations:*</code>, <code>admin:users:*</code>
            </p>
          </div>

          <div className="pt-4 border-t">
            <Dialog open={purgeAllOpen} onOpenChange={setPurgeAllOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purgar Todo el Caché
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Purgar todo el caché?</DialogTitle>
                  <DialogDescription>
                    Esta acción eliminará todas las claves del caché. Esta operación no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPurgeAllOpen(false)}
                    disabled={purging}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handlePurgeAll}
                    disabled={purging}
                  >
                    {purging ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Purgando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
