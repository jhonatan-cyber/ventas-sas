"use client"

import { Loader2, Send, Bell } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import type { NotificationType } from "@/lib/services/notification-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Organization {
  id: string
  name: string
  slug: string
}

interface BulkNotificationsClientProps {
  organizations: Organization[]
}

type TargetType = 'all_admins' | 'organization' | 'organizations' | 'users'

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'new_sale', label: 'Nueva Venta' },
  { value: 'new_quotation', label: 'Nueva Cotización' },
  { value: 'stock_low', label: 'Stock Bajo' },
  { value: 'quotation_expired', label: 'Cotización Expirada' },
  { value: 'expense_created', label: 'Gasto Creado' },
  { value: 'cash_register_opened', label: 'Caja Abierta' },
  { value: 'cash_register_closed', label: 'Caja Cerrada' },
  { value: 'user_created', label: 'Usuario Creado' },
  { value: 'product_created', label: 'Producto Creado' },
]

export function BulkNotificationsClient({ organizations }: BulkNotificationsClientProps) {
  const [targetType, setTargetType] = useState<TargetType>('all_admins')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([])
  const [type, setType] = useState<NotificationType>('system')
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(30)
  const [isLoading, setIsLoading] = useState(false)

  const handleOrganizationToggle = (organizationId: string) => {
    setSelectedOrganizationIds((prev) =>
      prev.includes(organizationId)
        ? prev.filter((id) => id !== organizationId)
        : [...prev, organizationId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: any = {
        targetType,
        type,
        title,
        message,
        expiresInDays,
      }

      // Agregar parámetros según el tipo de destino
      if (targetType === 'organization') {
        if (!selectedOrganizationId) {
          toast.error("Por favor selecciona una organización")
          setIsLoading(false)
          return
        }
        payload.organizationId = selectedOrganizationId
      } else if (targetType === 'organizations') {
        if (selectedOrganizationIds.length === 0) {
          toast.error("Por favor selecciona al menos una organización")
          setIsLoading(false)
          return
        }
        payload.organizationIds = selectedOrganizationIds
      } else if (targetType === 'users') {
        // Para usuarios específicos, se podría expandir más adelante
        toast.error("Envío a usuarios específicos aún no está implementado completamente")
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/administracion/notifications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al enviar notificaciones')
        setIsLoading(false)
        return
      }

      toast.success(`Notificación enviada exitosamente a ${data.count} destinatarios`)
      
      // Limpiar formulario
      setTitle("")
      setMessage("")
      setSelectedOrganizationId("")
      setSelectedOrganizationIds([])
      setExpiresInDays(30)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Crear Notificación Masiva
        </CardTitle>
        <CardDescription>
          Completa el formulario para enviar una notificación a múltiples destinatarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Destino */}
          <div className="space-y-2">
            <Label htmlFor="targetType">Destinatarios</Label>
            <Select value={targetType} onValueChange={(value) => setTargetType(value as TargetType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de destinatarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_admins">Todos los Administradores</SelectItem>
                <SelectItem value="organization">Una Organización</SelectItem>
                <SelectItem value="organizations">Múltiples Organizaciones</SelectItem>
                <SelectItem value="users" disabled>Usuarios Específicos (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Organización (para una organización) */}
          {targetType === 'organization' && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organización</Label>
              <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selector de Múltiples Organizaciones */}
          {targetType === 'organizations' && (
            <div className="space-y-2">
              <Label>Organizaciones ({selectedOrganizationIds.length} seleccionadas)</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {organizations.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay organizaciones disponibles</p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`org-${org.id}`}
                        checked={selectedOrganizationIds.includes(org.id)}
                        onCheckedChange={() => handleOrganizationToggle(org.id)}
                      />
                      <label
                        htmlFor={`org-${org.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {org.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tipo de Notificación */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Notificación</Label>
            <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de notificación" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((nt) => (
                  <SelectItem key={nt.value} value={nt.value}>
                    {nt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mantenimiento Programado"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/200 caracteres</p>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej: El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 4:00 AM"
              maxLength={1000}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">{message.length}/1000 caracteres</p>
          </div>

          {/* Días de Expiración */}
          <div className="space-y-2">
            <Label htmlFor="expiresInDays">Días de Expiración (opcional)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min={1}
              max={365}
              value={expiresInDays || ""}
              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="30"
            />
            <p className="text-xs text-gray-500">
              La notificación se eliminará automáticamente después de este tiempo (por defecto: 30 días)
            </p>
          </div>

          {/* Botón de Enviar */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !title || !message}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
