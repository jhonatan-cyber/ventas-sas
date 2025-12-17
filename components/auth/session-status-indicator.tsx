/**
 * Indicador de Estado de Sesión en Tiempo Real
 * 
 * Muestra el estado de la sesión del usuario y tiempo hasta expiración
 */

'use client'

import { Clock, Shield, Wifi, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'

interface SessionStatusIndicatorProps {
  customerSlug: string
  showDetails?: boolean
  className?: string
}

export function SessionStatusIndicator({ 
  customerSlug, 
  showDetails = false,
  className = '' 
}: SessionStatusIndicatorProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    timeUntilExpiry, 
    isNearExpiry,
    refreshTokens,
    lastActivity 
  } = useEnhancedAuth({ customerSlug })

  const [displayTime, setDisplayTime] = useState<string>('')
  const [isOnline, setIsOnline] = useState(true)

  // Formatear tiempo restante
  const formatTimeRemaining = useCallback((ms: number | null) => {
    if (!ms || ms <= 0) return 'Expirado'
    
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    
    return `${seconds}s`
  }, [])

  // Actualizar display cada segundo
  useEffect(() => {
    if (!isAuthenticated || !timeUntilExpiry) return

    const interval = setInterval(() => {
      setDisplayTime(formatTimeRemaining(timeUntilExpiry))
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, timeUntilExpiry, formatTimeRemaining])

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Refresh manual
  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshTokens()
    } catch (error) {
      console.error('Error en refresh manual:', error)
    }
  }, [refreshTokens])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-xs text-gray-500">Verificando...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs text-red-600">No autenticado</span>
      </div>
    )
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-orange-500'
    if (isNearExpiry) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión'
    if (isNearExpiry) return 'Expira pronto'
    return 'Activa'
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-auto p-2 ${className}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs">{getStatusText()}</span>
            {isNearExpiry && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {displayTime}
              </Badge>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Estado de Sesión</h4>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado:</span>
              <Badge variant={isNearExpiry ? 'destructive' : 'default'}>
                {getStatusText()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expira en:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-mono">{displayTime}</span>
              </div>
            </div>
            
            {lastActivity && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última actividad:</span>
                <span className="text-sm text-gray-500">
                  {new Date(lastActivity).toLocaleTimeString()}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexión:</span>
              <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              className="flex-1"
            >
              <Shield className="h-3 w-3 mr-1" />
              Renovar
            </Button>
          </div>
          
          {isNearExpiry && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              Tu sesión expirará pronto. Se renovará automáticamente si permaneces activo.
            </div>
          )}
          
          {!isOnline && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
              Sin conexión a internet. Algunas funciones pueden no estar disponibles.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}