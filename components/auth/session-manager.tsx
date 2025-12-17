/**
 * Componente de Gestión de Sesiones Activas
 * 
 * Permite al usuario ver y gestionar sus dispositivos conectados
 */

'use client'

import { Monitor, Smartphone, Tablet, Trash2, Shield, Clock, MapPin } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'

interface ActiveSession {
  id: string
  deviceName?: string
  deviceInfo?: {
    browser?: string
    os?: string
  }
  ipAddress?: string
  createdAt: string
  lastActivityAt: string
  isCurrent: boolean
}

interface SessionManagerProps {
  customerSlug: string
}

export function SessionManager({ customerSlug }: SessionManagerProps) {
  const { apiRequest, logoutOtherSessions } = useEnhancedAuth({ customerSlug })
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminating, setIsTerminating] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(`/api/${customerSlug}/auth/sessions`)
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Error al cargar sesiones activas')
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error)
      toast.error('Error al cargar sesiones activas')
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, apiRequest])

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      setIsTerminating(sessionId)
      
      const response = await apiRequest(`/api/${customerSlug}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
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
  }, [customerSlug, apiRequest])

  const terminateAllOtherSessions = useCallback(async () => {
    const success = await logoutOtherSessions()
    if (success) {
      await loadSessions()
    }
  }, [logoutOtherSessions, loadSessions])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const getDeviceIcon = (deviceInfo?: { browser?: string; os?: string }) => {
    if (!deviceInfo) return <Monitor className="h-5 w-5" />
    
    const { os } = deviceInfo
    if (os?.includes('Android') || os?.includes('iOS')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (os?.includes('iPad')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
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

  const getLocationInfo = (ipAddress?: string) => {
    if (!ipAddress || ipAddress === 'unknown') return null
    
    // En producción, usar un servicio de geolocalización por IP
    return `IP: ${ipAddress}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dispositivos Conectados
          </CardTitle>
          <CardDescription>
            Gestiona los dispositivos que tienen acceso a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Dispositivos Conectados
            </CardTitle>
            <CardDescription>
              Gestiona los dispositivos que tienen acceso a tu cuenta ({sessions.length} activos)
            </CardDescription>
          </div>
          
          {sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Cerrar Otras Sesiones
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cerrar todas las demás sesiones?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto cerrará la sesión en todos los demás dispositivos. 
                    Tendrás que iniciar sesión nuevamente en esos dispositivos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={terminateAllOtherSessions}>
                    Cerrar Sesiones
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                session.isCurrent 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  session.isCurrent 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {getDeviceIcon(session.deviceInfo)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {session.deviceName || 
                       `${session.deviceInfo?.browser || 'Navegador'} en ${session.deviceInfo?.os || 'Sistema'}`}
                    </h4>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Este dispositivo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastActivity(session.lastActivityAt)}
                    </div>
                    
                    {getLocationInfo(session.ipAddress) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getLocationInfo(session.ipAddress)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    Iniciada: {new Date(session.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {!session.isCurrent && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isTerminating === session.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Terminar esta sesión?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto cerrará la sesión en este dispositivo. 
                        Tendrás que iniciar sesión nuevamente si quieres acceder desde él.
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
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay sesiones activas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}