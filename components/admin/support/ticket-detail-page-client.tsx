"use client"

import { ArrowLeft, Clock, Download, Paperclip, RefreshCw, Send, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TicketCategory, TicketPriority, TicketStatus } from "@/lib/services/admin/support-service"
import { cn } from "@/lib/utils"

interface Admin {
  id: string
  fullName: string | null
  email: string
}

interface TicketComment {
  id: string
  authorType: "admin" | "organization" | "system"
  content: string
  isInternal: boolean
  createdAt: string
  author?: {
    id: string
    fullName: string | null
    email: string
    photo: string | null
  } | {
    id: string
    nombre: string | null
    apellido: string | null
    email: string | null
    foto: string | null
  } | null
  attachments?: {
    id: string
    fileName: string
    filePath: string
  }[]
}

interface TicketHistory {
  id: string
  changeType: string
  description: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
  changedBy: {
    fullName: string | null
  } | null
}

interface TicketDetails {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory | null
  assignedToId: string | null
  assignedTo?: {
    fullName: string | null
    email: string
    photo: string | null
  } | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  createdAt: string
  firstResponseAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  organization: {
    name: string
  }
  createdBy: {
    fullName: string | null
    email: string
  } | null
  createdBySasUser?: {
    nombre: string | null
    apellido: string | null
    email: string | null
    phone?: string | null
    foto?: string | null
  } | null
  comments?: TicketComment[]
  history?: TicketHistory[]
}

interface TicketDetailPageClientProps {
  initialTicket: TicketDetails
  admins: Admin[]
  isAdmin?: boolean
}

export function TicketDetailPageClient({ initialTicket, admins, isAdmin = true }: TicketDetailPageClientProps) {
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetails>(initialTicket)
  const [comment, setComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [aiImproving, setAiImproving] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const ticketId = initialTicket.id
  const hasCustomerMessage = (ticket.comments || []).some((c) => c.authorType !== "admin")

  const refreshTicket = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/administracion/support/tickets/${ticketId}`)
      const data = await response.json()
      if (data.success) {
        setTicket(data.ticket)
      } else {
        throw new Error(data.error || "No se pudo actualizar el ticket")
      }
    } catch (error) {
      console.error("Error refreshing ticket:", error)
      toast.error("No se pudo actualizar la información del ticket")
    } finally {
      setIsRefreshing(false)
    }
  }, [ticketId])

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshTicket()
    }, 10000)
    return () => clearInterval(interval)
  }, [refreshTicket])

  const handleUpdate = async (updates: Partial<TicketDetails>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/administracion/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Ticket actualizado")
        setTicket(data.ticket)
      } else {
        toast.error(data.error || "No se pudo actualizar el ticket")
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("No se pudo actualizar el ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("El comentario no puede estar vacío")
      return
    }
    setCommentLoading(true)
    try {
      const formData = new FormData()
      formData.append("content", comment)
      formData.append("isInternal", isInternal ? "true" : "false")
      if (attachment) {
        formData.append("attachments", attachment)
      }

      const response = await fetch(`/api/administracion/support/tickets/${ticketId}/comments`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudo agregar el comentario")
      }

      toast.success("Comentario agregado")
      setComment("")
      setIsInternal(false)
      setAttachment(null)
      await refreshTicket()
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el comentario")
    } finally {
      setCommentLoading(false)
    }
  }

  const getPriorityBadge = (priority: TicketPriority) => {
    const variants: Record<TicketPriority, { className: string; label: string }> = {
      low: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", label: "Baja" },
      medium: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300", label: "Media" },
      high: { className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300", label: "Alta" },
      urgent: { className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300", label: "Urgente" },
    }
    return variants[priority] || variants.medium
  }

  const getStatusBadge = (status: TicketStatus) => {
    const variants: Record<TicketStatus, { className: string; label: string }> = {
      open: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", label: "Abierto" },
      in_progress: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300", label: "En Progreso" },
      resolved: { className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300", label: "Resuelto" },
      closed: { className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300", label: "Cerrado" },
    }
    return variants[status] || variants.open
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getCategoryBadge = (category: TicketCategory | null) => {
    const variants: Record<string, { className: string; label: string }> = {
      bug: { className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300", label: "Bug" },
      feature_request: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", label: "Solicitud de función" },
      question: { className: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300", label: "Pregunta" },
      billing: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300", label: "Facturación" },
      technical: { className: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300", label: "Técnico" },
      other: { className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300", label: "Otro" },
    }
    return variants[category || "other"] || variants.other
  }

  const translateHistoryValue = (value: string | null): string => {
    if (!value) return ""
    
    // Traducir estados
    const statusMap: Record<string, string> = {
      open: "Abierto",
      in_progress: "En Progreso",
      resolved: "Resuelto",
      closed: "Cerrado",
    }
    
    // Traducir prioridades
    const priorityMap: Record<string, string> = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      urgent: "Urgente",
    }
    
    // Verificar si es un estado
    if (statusMap[value]) {
      return statusMap[value]
    }
    
    // Verificar si es una prioridad
    if (priorityMap[value]) {
      return priorityMap[value]
    }
    
    // Si no coincide con ningún mapa, devolver el valor original
    return value
  }

  const translateChangeType = (changeType: string): string => {
    const typeMap: Record<string, string> = {
      status_changed: "Cambio de estado",
      comment_added: "Comentario agregado",
      assigned: "Ticket asignado",
      unassigned: "Ticket desasignado",
      priority_changed: "Cambio de prioridad",
      category_changed: "Cambio de categoría",
    }
    return typeMap[changeType] || changeType
  }

  const renderAttachmentList = (items?: { id: string; fileName: string; filePath: string }[]) => {
    if (!items || items.length === 0) return null
    return (
      <ul className="space-y-1 text-left">
        {items.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[160px]">{attachment.fileName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" asChild>
              <a href={attachment.filePath} target="_blank" rel="noreferrer">
                <Download className="h-3 w-3" />
              </a>
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <div className="mt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="font-mono text-base">
                {ticket.ticketNumber}
              </Badge>
              <Badge className={getStatusBadge(ticket.status).className}>
                {getStatusBadge(ticket.status).label}
              </Badge>
              <Badge className={getPriorityBadge(ticket.priority).className}>
                {getPriorityBadge(ticket.priority).label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{ticket.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ticket de {ticket.organization.name} · Creado {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryDialogOpen(true)}
            className="rounded-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            Ver historial
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/administracion/support")}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshTicket()}
            className="rounded-full"
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr] flex-1 min-h-0 items-stretch">
        <Card className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] flex flex-col h-full">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Conversación</CardTitle>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {ticket.comments?.length || 0} mensajes
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 p-4 pt-4">
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => {
                  const isAdmin = comment.authorType === "admin"
                  
                  // Obtener información del autor
                  let authorName = ""
                  let authorPhoto: string | null = null
                  let authorInitials = ""
                  
                  if (comment.author) {
                    if (isAdmin && 'fullName' in comment.author) {
                      authorName = comment.author.fullName || comment.author.email || "Equipo de soporte"
                      authorPhoto = comment.author.photo || null
                      authorInitials = comment.author.fullName
                        ? comment.author.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                        : comment.author.email?.[0]?.toUpperCase() || "AD"
                    } else if (!isAdmin && 'nombre' in comment.author) {
                      const nombre = comment.author.nombre || ""
                      const apellido = comment.author.apellido || ""
                      authorName = `${nombre} ${apellido}`.trim() || comment.author.email || ticket.contactName || "Cliente"
                      authorPhoto = comment.author.foto || null
                      authorInitials = nombre && apellido
                        ? `${nombre[0]}${apellido[0]}`.toUpperCase()
                        : nombre
                        ? nombre[0].toUpperCase()
                        : comment.author.email?.[0]?.toUpperCase() || "C"
                    }
                  } else {
                    // Fallback si no hay información del autor
                    if (isAdmin) {
                      authorName = ticket.assignedTo?.fullName || ticket.assignedTo?.email || "Equipo de soporte"
                      authorPhoto = ticket.assignedTo?.photo || null
                      authorInitials = ticket.assignedTo?.fullName
                        ? ticket.assignedTo.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                        : "AD"
                    } else {
                      authorName = ticket.contactName || 
                        `${ticket.createdBySasUser?.nombre || ""} ${ticket.createdBySasUser?.apellido || ""}`.trim() ||
                        ticket.createdBySasUser?.email ||
                        "Cliente"
                      authorPhoto = ticket.createdBySasUser?.foto || null
                      authorInitials = ticket.contactName
                        ? ticket.contactName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                        : ticket.createdBySasUser?.nombre && ticket.createdBySasUser?.apellido
                        ? `${ticket.createdBySasUser.nombre[0]}${ticket.createdBySasUser.apellido[0]}`.toUpperCase()
                        : ticket.createdBySasUser?.nombre
                        ? ticket.createdBySasUser.nombre[0].toUpperCase()
                        : "C"
                    }
                  }
                  
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        "flex w-full gap-3",
                        isAdmin ? "justify-end text-right" : "justify-start text-left"
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        {authorPhoto && (
                          <AvatarImage src={authorPhoto} alt={authorName} />
                        )}
                        <AvatarFallback className={isAdmin ? "bg-blue-600 text-white" : ""}>
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-[85%] flex flex-col gap-1", isAdmin ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm shadow-sm border",
                            isAdmin
                              ? "bg-blue-600 text-white border-blue-500 rounded-br-none"
                              : "bg-gray-50 dark:bg-[#0c0c0c] border-gray-200 dark:border-[#2a2a2a] rounded-bl-none"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs">
                              {authorName}
                            </span>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-[10px] uppercase">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="w-full mt-1">
                          {renderAttachmentList(comment.attachments)}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">No hay comentarios aún</p>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4 flex-shrink-0">
              <Label className="text-sm font-semibold">
                Responder al ticket
                {ticket.status === "closed" && (
                  <span className="ml-2 text-xs font-normal text-red-500">
                    Este ticket está cerrado y no se pueden enviar más mensajes.
                  </span>
                )}
                {!ticket.assignedToId && ticket.status !== "closed" && (
                  <span className="ml-2 text-xs font-normal text-red-500">
                    Asigna el ticket a un usuario antes de responder.
                  </span>
                )}
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu mensaje para el cliente..."
                rows={4}
                className="rounded-lg resize-none"
                disabled={ticket.status === "closed" || !ticket.assignedToId || commentLoading || loading}
              />
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                    disabled={ticket.status === "closed"}
                  />
                  Comentario interno
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="attachment-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    disabled={ticket.status === "closed"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => document.getElementById("attachment-input")?.click()}
                    disabled={ticket.status === "closed"}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adjuntar archivo
                  </Button>
                  {attachment && (
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 max-w-[220px]">
                      {attachment.type.startsWith("image/") && (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-muted">
                          <img
                            src={URL.createObjectURL(attachment)}
                            alt={attachment.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <span className="truncate">
                        {attachment.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  onClick={handleAddComment}
                  disabled={ticket.status === "closed" || commentLoading || !ticket.assignedToId || !comment.trim()}
                  className="rounded-full w-full sm:w-auto flex items-center justify-center"
                >
                  {commentLoading ? "Enviando..." : "Responder"}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    ticket.status === "closed" ||
                    !ticket.assignedToId ||
                    commentLoading ||
                    aiImproving ||
                    (!comment.trim() && !hasCustomerMessage)
                  }
                  className="rounded-full w-full sm:w-auto flex items-center justify-center"
                  onClick={async () => {
                    try {
                      setAiImproving(true)
                      const response = await fetch(`/api/administracion/support/tickets/${ticketId}/improve-comment`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ text: comment }),
                      })
                      const data = await response.json()
                      if (!response.ok || !data.success) {
                        throw new Error(data.error || "No se pudo mejorar el texto")
                      }
                      setComment(data.text)
                      toast.success("Texto mejorado con IA")
                    } catch (error) {
                      console.error("Error improving text with AI:", error)
                      toast.error(error instanceof Error ? error.message : "No se pudo mejorar el texto con IA")
                    } finally {
                      setAiImproving(false)
                    }
                  }}
                >
                  {aiImproving
                    ? "Mejorando..."
                    : comment.trim()
                    ? "Mejorar con IA"
                    : "Responder con IA"}
                  <Sparkles className={`h-4 w-4 ml-2 ${aiImproving ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 h-full">
          <Card className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] flex-1">
            <CardHeader>
              <CardTitle>Gestión del ticket</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Asignado a</Label>
                {isAdmin ? (
                  <Select
                    value={ticket.assignedToId ?? "unassigned"}
                    onValueChange={(value) => {
                      const assignedId = value === "unassigned" ? null : value
                      const updates: Partial<TicketDetails> = {
                        assignedToId: assignedId,
                      }
                      // Si se asigna un usuario, cambiar el estado automáticamente a "in_progress"
                      if (assignedId && ticket.status !== "in_progress") {
                        updates.status = "in_progress"
                      }
                      void handleUpdate(updates)
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="rounded-full mt-2">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {admins
                        .sort((a, b) => {
                          const nameA = (a.fullName || a.email || "").toLowerCase()
                          const nameB = (b.fullName || b.email || "").toLowerCase()
                          return nameA.localeCompare(nameB)
                        })
                        .map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.fullName || admin.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {ticket.assignedTo?.fullName || ticket.assignedTo?.email || "Sin asignar"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold">Estado</Label>
                <div className="mt-2">
                  <Badge className={getStatusBadge(ticket.status as TicketStatus).className}>
                    {getStatusBadge(ticket.status as TicketStatus).label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Prioridad</Label>
                <div className="mt-2">
                  <Badge className={getPriorityBadge(ticket.priority as TicketPriority).className}>
                    {getPriorityBadge(ticket.priority as TicketPriority).label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Categoría</Label>
                <div className="mt-2">
                  <Badge className={getCategoryBadge(ticket.category).className}>
                    {getCategoryBadge(ticket.category).label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] flex-1">
            <CardHeader>
              <CardTitle>Resumen y contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Organización</Label>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{ticket.organization.name}</p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reportado por</Label>
                <p className="mt-1">
                  {ticket.createdBy?.fullName ||
                    ticket.createdBy?.email ||
                    `${ticket.createdBySasUser?.nombre || ""} ${ticket.createdBySasUser?.apellido || ""}`.trim() ||
                    ticket.createdBySasUser?.email ||
                    ticket.contactName ||
                    "Cliente"}
                </p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Correo</Label>
                <p className="mt-1">{ticket.contactEmail || ticket.createdBySasUser?.email || ticket.createdBy?.email || "-"}</p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Teléfono</Label>
                <p className="mt-1">{ticket.contactPhone || ticket.createdBySasUser?.phone || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <Label className="uppercase tracking-wide">Creado</Label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.createdAt)}</p>
                </div>
                <div>
                  <Label className="uppercase tracking-wide">1ra respuesta</Label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.firstResponseAt)}</p>
                </div>
                <div>
                  <Label className="uppercase tracking-wide">Resuelto</Label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.resolvedAt)}</p>
                </div>
                <div>
                  <Label className="uppercase tracking-wide">Cerrado</Label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.closedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal de Historial */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial del Ticket</DialogTitle>
            <DialogDescription>
              Registro de todos los cambios realizados en este ticket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {ticket.history && ticket.history.length > 0 ? (
              ticket.history
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0c0c0c]"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.description || translateChangeType(item.changeType) || "Cambio realizado"}
                          </p>
                          {item.oldValue && item.newValue && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                {translateHistoryValue(item.oldValue)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                {translateHistoryValue(item.newValue)}
                              </span>
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(item.createdAt)}</span>
                            {item.changedBy && (
                              <>
                                <span>•</span>
                                <span>Por: {item.changedBy.fullName || "Sistema"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay historial disponible para este ticket</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

