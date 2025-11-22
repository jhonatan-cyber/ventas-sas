"use client"

import { Paperclip, X } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface SupportTicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: {
      title: string
      description: string
      priority: string
      category: string
      contactEmail?: string
      contactPhone?: string
    },
    attachments: File[]
  ) => Promise<void>
  defaultContactEmail?: string | null
  defaultContactPhone?: string | null
  loading?: boolean
}

export function SupportTicketFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultContactEmail,
  defaultContactPhone,
  loading = false,
}: SupportTicketFormDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("technical")
  const [contactEmail, setContactEmail] = useState(defaultContactEmail || "")
  const [contactPhone, setContactPhone] = useState(defaultContactPhone || "")
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    if (open) {
      setContactEmail(defaultContactEmail || "")
      setContactPhone(defaultContactPhone || "")
      setAttachments([])
    } else {
      setTitle("")
      setDescription("")
      setPriority("medium")
      setCategory("technical")
    }
  }, [open, defaultContactEmail, defaultContactPhone])

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      contactEmail: contactEmail?.trim() || undefined,
      contactPhone: contactPhone?.trim() || undefined,
    }, attachments)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (files.length === 0) return
    setAttachments((prev) => [...prev, ...files])
    event.target.value = ""
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo ticket de soporte</DialogTitle>
          <DialogDescription>
            Cuéntanos tu problema o solicitud y nuestro equipo te responderá lo antes posible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ticket-title">Título</Label>
            <Input
              id="ticket-title"
              placeholder="Ej. Problemas para registrar una venta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Descripción</Label>
            <Textarea
              id="ticket-description"
              placeholder="Describe el problema con el mayor detalle posible..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
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
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Solicitud de mejora</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="question">Pregunta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-contact-email">Correo de contacto</Label>
              <Input
                id="ticket-contact-email"
                placeholder="tu-correo@empresa.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-contact-phone">Teléfono de contacto</Label>
              <Input
                id="ticket-contact-phone"
                placeholder="+591 70000000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adjuntos</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-full"
                onClick={() => document.getElementById("ticket-attachments-input")?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {attachments.length > 0 ? "Agregar más archivos" : "Adjuntar archivos"}
              </Button>
              <Input
                id="ticket-attachments-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {attachments.length > 0 && (
                <ul className="space-y-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 text-sm">
                  {attachments.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-red-500"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !description.trim()}
            className="rounded-full"
          >
            {loading ? "Enviando..." : "Enviar ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

