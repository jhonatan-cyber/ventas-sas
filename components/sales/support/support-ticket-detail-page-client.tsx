"use client"

import { ArrowLeft, Download, Paperclip, RefreshCw, Send, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import type { SupportTicketDetails } from "./support-ticket-detail-dialog"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface SupportTicketDetailPageClientProps {
  customerSlug: string
  initialTicket: SupportTicketDetails
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
}

export function SupportTicketDetailPageClient({ customerSlug, initialTicket }: SupportTicketDetailPageClientProps) {
  const router = useRouter()
  const [ticket, setTicket] = useState(initialTicket)
  const [comment, setComment] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [aiImproving, setAiImproving] = useState(false)

  const hasSupportMessage = (ticket.comments || []).some((c) => c.authorType === "admin")

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

  const refreshTicket = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/${customerSlug}/support/tickets/${ticket.id}`, {
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el ticket")
      }
      setTicket(data.ticket)
    } catch (error) {
      console.error("Error refreshing ticket:", error)
      toast.error("No se pudo actualizar el ticket")
    } finally {
      setIsRefreshing(false)
    }
  }, [customerSlug, ticket.id])

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshTicket()
    }, 12000)

    return () => clearInterval(interval)
  }, [refreshTicket])

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Escribe un mensaje antes de enviar")
      return
    }

    setIsSending(true)
    try {
      const body = new FormData()
      body.append("content", comment.trim())
      attachments.forEach((file) => body.append("attachments", file))

      const response = await fetch(`/api/${customerSlug}/support/tickets/${ticket.id}/comments`, {
        method: "POST",
        body,
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo enviar el mensaje")
      }

      toast.success("Mensaje enviado")
      setComment("")
      setAttachments([])
      await refreshTicket()
    } catch (error) {
      console.error("Error sending comment:", error)
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje")
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

  const renderAttachmentList = (items?: SupportTicketDetails["attachments"]) => {
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

  const handleCloseTicket = async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo cerrar el ticket")
      }
      toast.success("Ticket cerrado correctamente")
      setTicket(data.ticket)
    } catch (error) {
      console.error("Error closing ticket:", error)
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar el ticket")
    }
  }

  return (
    <div className="space-y-6 py-4 md:py-6 px-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-base">
                {ticket.ticketNumber}
              </Badge>
              <Badge>{STATUS_LABELS[ticket.status] || ticket.status}</Badge>
              <Badge variant="secondary">{PRIORITY_LABELS[ticket.priority] || ticket.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{ticket.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Última actualización: {formatDate(ticket.closedAt || ticket.resolvedAt || ticket.firstResponseAt || ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${customerSlug}/support`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshTicket()}
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111]">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Conversación</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {ticket.comments?.length || 0} mensajes
              </p>
            </div>
            {ticket.status !== "closed" && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                onClick={handleCloseTicket}
              >
                Cerrar ticket
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((commentItem) => {
                  const isAdmin = commentItem.authorType === "admin"
                  const adminName =
                    ticket.assignedTo?.fullName ||
                    ticket.assignedTo?.email ||
                    "Equipo de soporte"
                  const userName =
                    `${ticket.createdBySasUser?.nombre || ""} ${ticket.createdBySasUser?.apellido || ""}`.trim() ||
                    ticket.contactName ||
                    ticket.createdBySasUser?.email ||
                    "Tú"
                  const authorName = isAdmin ? adminName : userName
                  const initials =
                    authorName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "US"

                  return (
                    <div
                      key={commentItem.id}
                      className={cn("flex w-full gap-3", isAdmin ? "justify-end text-right" : "justify-start text-left")}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={isAdmin ? "bg-blue-600 text-white" : ""}>
                          {initials}
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
                            {commentItem.attachments && commentItem.attachments.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] uppercase">
                                Adjuntos
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{commentItem.content}</p>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(commentItem.createdAt)}
                        </span>
                        {commentItem.attachments && commentItem.attachments.length > 0 && (
                          <div className="w-full mt-1">
                            {renderAttachmentList(commentItem.attachments)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                  Todavía no hay mensajes en este ticket.
                </p>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              {ticket.status === "closed" && (
                <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  Este ticket está cerrado y no se pueden enviar más mensajes.
                </div>
              )}
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu mensaje para el equipo de soporte..."
                rows={4}
                disabled={ticket.status === "closed" || isSending}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full w-full sm:w-auto"
                  onClick={() => document.getElementById("sales-support-attachments")?.click()}
                  disabled={ticket.status === "closed"}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {attachments.length > 0 ? "Agregar más archivos" : "Adjuntar archivos"}
                </Button>
                <input
                  id="sales-support-attachments"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={ticket.status === "closed"}
                />
                {attachments.length > 0 && (
                  <ul className="space-y-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 text-xs">
                    {attachments.map((file, index) => {
                      const isImage = file.type.startsWith("image/")
                      const previewUrl = isImage ? URL.createObjectURL(file) : null
                      return (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage && (
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-muted">
                                <img
                                  src={previewUrl ?? undefined}
                                  alt={file.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <span className="truncate">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-gray-500 hover:text-red-500 flex-shrink-0"
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  className="rounded-full w-full sm:w-auto"
                  onClick={handleAddComment}
                  disabled={ticket.status === "closed" || isSending || !comment.trim()}
                >
                  {isSending ? "Enviando..." : "Enviar mensaje"}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full w-full sm:w-auto flex items-center justify-center"
                  disabled={ticket.status === "closed" || isSending || aiImproving || (!comment.trim() && !hasSupportMessage)}
                  onClick={async () => {
                    try {
                      setAiImproving(true)
                      const response = await fetch(
                        `/api/${customerSlug}/support/tickets/${ticket.id}/improve-comment`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ text: comment }),
                        }
                      )
                      const data = await response.json()
                      if (!response.ok || !data.success) {
                        throw new Error(data.error || "No se pudo mejorar el texto")
                      }
                      setComment(data.text)
                      toast.success("Texto mejorado con IA")
                    } catch (error) {
                      console.error("Error improving text with AI (SAS):", error)
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

        <Card className="border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111]">
          <CardHeader>
            <CardTitle>Detalles del ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Estado</Label>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{STATUS_LABELS[ticket.status] || ticket.status}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Prioridad</Label>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{PRIORITY_LABELS[ticket.priority] || ticket.priority}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Categoría</Label>
              <p className="mt-1">{ticket.category || "General"}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Correo de contacto</Label>
              <p className="mt-1">{ticket.contactEmail || "—"}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Teléfono</Label>
              <p className="mt-1">{ticket.contactPhone || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-2 border-t">
              <div>
                <Label className="uppercase">Creado</Label>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <Label className="uppercase">Actualizado</Label>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.closedAt || ticket.resolvedAt || ticket.firstResponseAt || ticket.createdAt)}</p>
              </div>
              <div>
                <Label className="uppercase">1.ª respuesta</Label>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.firstResponseAt)}</p>
              </div>
              <div>
                <Label className="uppercase">Resuelto</Label>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(ticket.resolvedAt)}</p>
              </div>
            </div>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Archivos adjuntos</Label>
                {renderAttachmentList(ticket.attachments)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

