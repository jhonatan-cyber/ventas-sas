/**
 * Página de Gestión de Sesiones - Sistema de Administración
 * 
 * Permite a los administradores monitorear y gestionar todas las sesiones activas del sistema
 */

"use client"

import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Clock, 
  MapPin,
  Users,
  Activity,
  AlertTriangle,
  Eye
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AdminLayout } from "@/components/layout/admin-layout"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SessionData {
  id: string
  userId: string
  userName: string
  userEmail: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  deviceName?: string
  deviceInfo?: {
    browser?: string
    os?: string
  }
  ipAddress?: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  refreshCount: number
  isActive: boolean
}

interface SessionStats {
  totalActiveSessions: number
  totalActiveUsers: number
  totalOrganizations: number
  recentRefreshAttempts: number
  suspiciousActivity: number
  averageSessionsPerUser: number
}

export function SessionsPageClient() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOrg, setFilterOrg] = useState("all")
  const [filterDevice, setFilterDevice] = useState("all")
  const [isTerminating, setIsTerminating] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Cargar sesiones y estadísticas desde la misma API
      const response = await fetch('/api/administracion/sessions', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        setStats(data.statistics || null)
      } else {
        toast.error('Error al cargar sesiones')
      }

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar datos de sesiones')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      setIsTerminating(sessionId)
      
      const response = await fetch(`/api/administracion/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast.success('Sesión terminada correctamente')
      } else {
        toast.error('Error al terminar la sesión')
      }
    } catch (error) {
      console.error('Error terminando sesión:', error)
      toast.error('Error al terminar la sesión')
    } finally {
      setIsTerminating(null)
    }
  }, [])

  const terminateAllUserSessions = useCallback(async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/administracion/sessions/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessions(prev => prev.filter(s => s.userId !== userId))
        toast.success(`${data.invalidatedCount} sesiones de ${userName} terminadas`)
      } else {
        toast.error('Error al terminar sesiones del usuario')
      }
    } catch (error) {
      console.error('Error terminando sesiones del usuario:', error)
      toast.error('Error al terminar sesiones del usuario')
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Filtrar sesiones
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === "" || 
      session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.organizationSlug.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesOrg = filterOrg === "all" || session.organizationSlug === filterOrg
    
    const matchesDevice = filterDevice === "all" || 
      (filterDevice === "desktop" && session.deviceInfo?.os && !["Android", "iOS"].includes(session.deviceInfo.os)) ||
      (filterDevice === "mobile" && session.deviceInfo?.os && ["Android", "iOS"].includes(session.deviceInfo.os))

    return matchesSearch && matchesOrg && matchesDevice
  })

  const getDeviceIcon = (deviceInfo?: { browser?: string; os?: string }) => {
    if (!deviceInfo) return <Monitor className="h-4 w-4" />
    
    const { os } = deviceInfo
    if (os?.includes('Android') || os?.includes('iOS')) {
      return <Smartphone className="h-4 w-4" />
    }
    if (os?.includes('iPad')) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return date.toLocaleDateString()
  }

  const getUniqueOrganizations = () => {
    const orgs = new Set(sessions.map(s => s.organizationSlug))
    return Array.from(orgs).sort()
  }

  return (
    <AdminLayout>
      <div className="space-y-6 px-4 md:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Sesiones
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitorea y gestiona todas las sesiones activas del sistema
            </p>
          </div>
          <Button onClick={loadSessions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalActiveSessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.averageSessionsPerUser ? stats.averageSessionsPerUser.toFixed(1) : '0.0'} promedio por usuario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalActiveUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  En {stats?.totalOrganizations || 0} organizaciones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refreshes Recientes</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentRefreshAttempts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Últimas 24 horas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actividad Sospechosa</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.suspiciousActivity || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Sesiones marcadas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por usuario, email u organización..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Organización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las organizaciones</SelectItem>
                  {getUniqueOrganizations().map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDevice} onValueChange={setFilterDevice}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Móvil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Sesiones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Sesiones Activas ({filteredSessions.length})
            </CardTitle>
            <CardDescription>
              Lista de todas las sesiones activas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando sesiones...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay sesiones que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        {getDeviceIcon(session.deviceInfo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{session.userName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {session.organizationSlug}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">{session.userEmail}</span>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActivity(session.lastActivityAt)}
                          </div>
                          
                          {session.ipAddress && session.ipAddress !== 'unknown' && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.ipAddress}
                            </div>
                          )}
                          
                          <div className="text-xs">
                            {session.refreshCount} refreshes
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {session.deviceName || 
                           `${session.deviceInfo?.browser || 'Navegador'} en ${session.deviceInfo?.os || 'Sistema'}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Todas del usuario
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Terminar todas las sesiones del usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto cerrará todas las sesiones activas de {session.userName}. 
                              El usuario tendrá que iniciar sesión nuevamente en todos sus dispositivos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => terminateAllUserSessions(session.userId, session.userName)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Terminar Todas
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isTerminating === session.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Terminar esta sesión?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto cerrará la sesión de {session.userName} en este dispositivo específico.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => terminateSession(session.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Terminar Sesión
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}