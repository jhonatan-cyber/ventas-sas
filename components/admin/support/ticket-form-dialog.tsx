"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TicketPriority, TicketCategory } from "@/lib/services/admin/support-service"

interface Organization {
  id: string
  name: string
}

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  onSave: (data: {
    organizationId: string
    title: string
    description: string
    priority: TicketPriority
    category: TicketCategory
  }) => Promise<void>
  loading?: boolean
}

export function TicketFormDialog({
  open,
  onOpenChange,
  organizations,
  onSave,
  loading = false,
}: TicketFormDialogProps) {
  const [formData, setFormData] = useState({
    organizationId: "",
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    category: "other" as TicketCategory,
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        organizationId: "",
        title: "",
        description: "",
        priority: "medium",
        category: "other",
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!formData.organizationId || !formData.title || !formData.description) {
      return
    }
    await onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Crea un nuevo ticket de soporte para una organización
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="form-organization">Organización <span className="text-red-500">*</span></Label>
            <Select
              value={formData.organizationId}
              onValueChange={(value) => setFormData({ ...formData, organizationId: value })}
            >
              <SelectTrigger className="rounded-full">
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

          <div className="space-y-2">
            <Label htmlFor="form-title">Título <span className="text-red-500">*</span></Label>
            <Input
              id="form-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Resumen del problema o solicitud"
              className="rounded-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description">Descripción <span className="text-red-500">*</span></Label>
            <Textarea
              id="form-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el problema o solicitud en detalle..."
              rows={6}
              className="rounded-lg resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Solicitud de Función</SelectItem>
                  <SelectItem value="question">Pregunta</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.organizationId || !formData.title || !formData.description}
          >
            {loading ? "Creando..." : "Crear Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
