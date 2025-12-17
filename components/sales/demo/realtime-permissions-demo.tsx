"use client"

import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSasPermissions } from '@/hooks/sales/use-sas-permissions'

interface RealtimePermissionsDemoProps {
  customerSlug: string
}

export function RealtimePermissionsDemo({ customerSlug }: RealtimePermissionsDemoProps) {
  const { permissions, isLoading, forceRefresh } = useSasPermissions()
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    // Conectar a SSE para mostrar eventos en tiempo real
    const eventSource = new EventSource(`/api/${customerSlug}/permissions/events`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'role_updated' || data.type === 'permissions_changed') {
          setLastUpdate(data.message)
          setEventCount(prev => prev + 1)
        }
      } catch (error) {
        console.error('Error procesando evento demo:', error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [customerSlug])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Demo: Permisos en Tiempo Real
          <Badge variant="secondary">{eventCount} eventos</Badge>
        </CardTitle>
        <CardDescription>
          Esta demo muestra cómo los permisos se actualizan automáticamente cuando un administrador los modifica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Permisos Actuales ({permissions.length})</h4>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {isLoading ? (
              <Badge variant="outline">Cargando...</Badge>
            ) : permissions.length > 0 ? (
              permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))
            ) : (
              <Badge variant="destructive">Sin permisos</Badge>
            )}
          </div>
        </div>

        {lastUpdate && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Último evento:</strong> {lastUpdate}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Los permisos se actualizaron automáticamente
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={forceRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Refrescar Manualmente'}
          </Button>
          <Button 
            onClick={() => {
              setEventCount(0)
              setLastUpdate('')
            }} 
            variant="outline" 
            size="sm"
          >
            Limpiar Demo
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Cómo probar:</strong></p>
          <p>1. Abre otra pestaña y ve a Gestión de Roles</p>
          <p>2. Modifica los permisos de tu rol actual</p>
          <p>3. Observa cómo esta demo se actualiza automáticamente</p>
        </div>
      </CardContent>
    </Card>
  )
}