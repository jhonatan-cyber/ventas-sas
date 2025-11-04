"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send } from "lucide-react"
import { TicketStatus, TicketPriority, TicketCategory } from "@/lib/services/admin/support-service"

interface Admin {
  id: string
  fullName: string | null
  email: string
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
  comments?: Array<{
    id: string
    authorType: 'admin' | 'organization' | 'system'
    content: string
    isInternal: boolean
    createdAt: string
  }>
  history?: Array<{
    id: string
    changeType: string
    description: string | null
    oldValue: string | null
    newValue: string | null
    createdAt: string
    changedBy: {
      fullName: string | null
    } | null
  }>
}

interface TicketDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: TicketDetails | null
  admins: Admin[]
  onUpdate: (updates: any) => Promise<void>
  onAddComment: (content: string, isInternal: boolean) => Promise<void>
  loading?: boolean
}

export function TicketDetailDialog({
  open,
  onOpenChange,
  ticket,
  admins,
  onUpdate,
  onAddComment,
  loading = false,
}: TicketDetailDialogProps) {
  const [newComment, setNewComment] = useState("")
  const [isCommentInternal, setIsCommentInternal] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setNewComment("")
      setIsCommentInternal(false)
    }
  }, [open])

  const handleAddComment = async () => {
    if (!ticket || !newComment.trim()) return
    setCommentLoading(true)
    try {
      await onAddComment(newComment, isCommentInternal)
      setNewComment("")
      setIsCommentInternal(false)
    } finally {
      setCommentLoading(false)
    }
  }

  const getPriorityBadge = (priority: TicketPriority) => {
    const variants: Record<TicketPriority, { className: string }> = {
      low: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
      medium: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" },
      high: { className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
      urgent: { className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
    }
    return variants[priority] || variants.medium
  }

  const getStatusBadge = (status: TicketStatus) => {
    const variants: Record<TicketStatus, { className: string, label: string }> = {
      open: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", label: "Abierto" },
      in_progress: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300", label: "En Progreso" },
      resolved: { className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300", label: "Resuelto" },
      closed: { className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300", label: "Cerrado" },
    }
    return variants[status] || variants.open
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatCategory = (category: TicketCategory | null) => {
    if (!category) return "Otro"
    const labels: Record<TicketCategory, string> = {
      bug: "Bug",
      feature_request: "Solicitud de Función",
      question: "Pregunta",
      billing: "Facturación",
      technical: "Técnico",
      other: "Otro",
    }
    return labels[category] || "Otro"
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <Badge className={getStatusBadge(ticket.status).className}>
              {getStatusBadge(ticket.status).label}
            </Badge>
            <Badge className={getPriorityBadge(ticket.priority).className}>
              {ticket.priority === 'low' ? 'Baja' : 
               ticket.priority === 'medium' ? 'Media' : 
               ticket.priority === 'high' ? 'Alta' : 'Urgente'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {ticket.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="comments">
              Comentarios ({ticket.comments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Descripción</Label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Organización</Label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {ticket.organization.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Creado por</Label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {ticket.createdBy?.fullName || ticket.createdBy?.email || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Asignado a</Label>
                  <Select
                    value={ticket.assignedToId || ""}
                    onValueChange={(value) => onUpdate({ assignedToId: value || null })}
                    disabled={loading}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.fullName || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Categoría</Label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formatCategory(ticket.category)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Estado</Label>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => onUpdate({ status: value as TicketStatus })}
                    disabled={loading}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Prioridad</Label>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => onUpdate({ priority: value as TicketPriority })}
                    disabled={loading}
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
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-semibold">Creado</Label>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
                {ticket.firstResponseAt && (
                  <div>
                    <Label className="text-sm font-semibold">Primera Respuesta</Label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.firstResponseAt)}
                    </p>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div>
                    <Label className="text-sm font-semibold">Resuelto</Label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.resolvedAt)}
                    </p>
                  </div>
                )}
                {ticket.closedAt && (
                  <div>
                    <Label className="text-sm font-semibold">Cerrado</Label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.closedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {ticket.comments?.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg border ${
                    comment.isInternal
                      ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                      : "bg-gray-50 dark:bg-[#0c0c0c] border-gray-200 dark:border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.authorType === 'admin' ? 'Admin' : 
                         comment.authorType === 'organization' ? 'Organización' : 'Sistema'}
                      </span>
                      {comment.isInternal && (
                        <Badge variant="secondary" className="text-xs">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
              {(!ticket.comments || ticket.comments.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay comentarios aún
                </p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="new-comment">Agregar comentario</Label>
              <Textarea
                id="new-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={4}
                className="rounded-lg resize-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internal-comment"
                  checked={isCommentInternal}
                  onChange={(e) => setIsCommentInternal(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="internal-comment" className="text-sm font-normal cursor-pointer">
                  Comentario interno (solo visible para admins)
                </Label>
              </div>
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || commentLoading} 
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {commentLoading ? "Enviando..." : "Enviar comentario"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ticket.history?.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border bg-gray-50 dark:bg-[#0c0c0c] border-gray-200 dark:border-[#2a2a2a]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{item.description || item.changeType}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  {item.changedBy && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Por: {item.changedBy.fullName || "Sistema"}
                    </p>
                  )}
                  {item.oldValue && item.newValue && (
                    <div className="mt-2 text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Antes: </span>
                      <span className="line-through">{item.oldValue}</span>
                      {" → "}
                      <span className="font-semibold">{item.newValue}</span>
                    </div>
                  )}
                </div>
              ))}
              {(!ticket.history || ticket.history.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay historial disponible
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
