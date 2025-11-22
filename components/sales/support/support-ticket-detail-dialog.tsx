"use client"

import { Download, Paperclip, Send, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SupportAttachment {
  id: string
  fileName: string
  filePath: string
  mimeType: string
  createdAt: string
}

interface SupportTicketDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: SupportTicketDetails | null
  onAddComment: (ticketId: string, content: string, attachments: File[]) => Promise<void>
  loading?: boolean
}

export interface SupportTicketDetails {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: string
  priority: string
  category: string | null
  assignedTo?: {
    id: string
    fullName: string | null
    email: string
  } | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  createdAt: string
  firstResponseAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  createdBySasUser?: {
    id: string
    nombre: string | null
    apellido: string | null
    email: string | null
  } | null
  attachments?: SupportAttachment[]
  comments?: Array<{
    id: string
    authorType: string
    content: string
    createdAt: string
    attachments?: SupportAttachment[]
  }>
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
}

export function SupportTicketDetailDialog({
  open,
  onOpenChange,
  ticket,
  onAddComment,
  loading = false,
}: SupportTicketDetailDialogProps) {
  const [comment, setComment] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!open) {
      setComment("")
      setAttachments([])
      setIsSending(false)
    }
  }, [open])

  if (!ticket) return null

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setIsSending(true)
    try {
      await onAddComment(ticket.id, comment.trim(), attachments)
      setComment("")
      setAttachments([])
    } finally {
      setIsSending(false)
    }
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

  const formatDate = (value?: string | null) => {
    if (!value) return "-"
    return new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  }

  const renderAttachmentList = (items?: SupportAttachment[]) => {
    if (!items || items.length === 0) return null
    return (
      <ul className="space-y-1">
        {items.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[220px]">{attachment.fileName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
              <a href={attachment.filePath} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground font-mono">{ticket.ticketNumber}</span>
            <span className="text-xl font-semibold">{ticket.title}</span>
            <div className="flex flex-wrap gap-2">
              <Badge>{STATUS_LABELS[ticket.status] || ticket.status}</Badge>
              <Badge variant="secondary">{PRIORITY_LABELS[ticket.priority] || ticket.priority}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>Detalles y conversación con soporte</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Descripción</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Contacto</Label>
              <p className="text-muted-foreground">{ticket.contactName || "Sin especificar"}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-muted-foreground">{ticket.contactEmail || "-"}</p>
            </div>
            <div>
              <Label>Teléfono</Label>
              <p className="text-muted-foreground">{ticket.contactPhone || "-"}</p>
            </div>
            <div>
              <Label>Categoría</Label>
              <p className="text-muted-foreground">{ticket.category || "General"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label>Creado</Label>
              <p className="text-muted-foreground">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <Label>1ra respuesta</Label>
              <p className="text-muted-foreground">{formatDate(ticket.firstResponseAt)}</p>
            </div>
            <div>
              <Label>Resuelto</Label>
              <p className="text-muted-foreground">{formatDate(ticket.resolvedAt)}</p>
            </div>
            <div>
              <Label>Cerrado</Label>
              <p className="text-muted-foreground">{formatDate(ticket.closedAt)}</p>
            </div>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Archivos adjuntos</Label>
              {renderAttachmentList(ticket.attachments)}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Comentarios</Label>
              <span className="text-xs text-muted-foreground">{ticket.comments?.length || 0} mensajes</span>
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-[#0c0c0c] max-h-[320px] overflow-y-auto">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((commentItem) => (
                  <div key={commentItem.id} className="rounded-md bg-white dark:bg-[#111111] border border-gray-100 dark:border-gray-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {commentItem.authorType === "admin" ? "Soporte" : "Tú"}
                      </p>
                      <span className="text-[11px] text-gray-400">{formatDate(commentItem.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {commentItem.content}
                    </p>
                    {commentItem.attachments && commentItem.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">Archivos</Label>
                        {renderAttachmentList(commentItem.attachments)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Aún no hay comentarios. Usa el formulario para escribirle a soporte.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Escribe tu respuesta para el equipo de soporte..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => document.getElementById("support-comment-attachments")?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {attachments.length > 0 ? "Agregar más archivos" : "Adjuntar archivos"}
                </Button>
                <input
                  id="support-comment-attachments"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                  <ul className="space-y-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 text-xs">
                    {attachments.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                className="w-full rounded-full"
                onClick={handleAddComment}
                disabled={isSending || !comment.trim() || loading}
              >
                {isSending ? "Enviando..." : "Enviar mensaje"}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
