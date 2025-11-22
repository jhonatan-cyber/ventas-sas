"use client"

import { Eye } from "lucide-react"
import { memo, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TicketStatus, TicketPriority } from "@/lib/services/admin/support-service"

interface Ticket {
  id: string
  ticketNumber: string
  organizationId: string
  createdById: string | null
  createdBySasUser?: {
    id: string
    nombre: string | null
    apellido: string | null
    email: string | null
    phone?: string | null
  } | null
  assignedToId: string | null
  title: string
  description: string
  status: TicketStatus | string
  priority: TicketPriority | string
  category: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  resolvedAt: string | null
  closedAt: string | null
  firstResponseAt: string | null
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    slug: string
  }
  createdBy: {
    id: string
    fullName: string | null
    email: string
  } | null
  assignedTo: {
    id: string
    fullName: string | null
    email: string
  } | null
  _count: {
    comments: number
    attachments: number
  }
}

interface SupportTicketsTableProps {
  tickets: Ticket[]
  total: number
  loading: boolean
  page: number
  pageSize: number
  onViewTicket: (ticket: Ticket) => void | Promise<void>
  onPageChange: (page: number) => void
  isAdmin?: boolean
}

function SupportTicketsTableComponent({
  tickets,
  total,
  loading,
  page,
  pageSize,
  onViewTicket,
  onPageChange,
  isAdmin = true,
}: SupportTicketsTableProps) {
  const priorityVariants = useMemo(() => ({
    low: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    medium: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" },
    high: { className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
    urgent: { className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  }), [])

  const statusVariants = useMemo(() => ({
    open: { className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", label: "Abierto" },
    in_progress: { className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300", label: "En Progreso" },
    resolved: { className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300", label: "Resuelto" },
    closed: { className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300", label: "Cerrado" },
  }), [])

  const getPriorityBadge = (priority: TicketPriority | string) => {
    return priorityVariants[priority as TicketPriority] || priorityVariants.medium
  }

  const getStatusBadge = (status: TicketStatus | string) => {
    return statusVariants[status as TicketStatus] || statusVariants.open
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

  const getReporterLabel = (ticket: Ticket) => {
    if (ticket.createdBy) {
      return ticket.createdBy.fullName || ticket.createdBy.email || 'Admin'
    }
    if (ticket.createdBySasUser) {
      return `${ticket.createdBySasUser.nombre || ''} ${ticket.createdBySasUser.apellido || ''}`.trim() || ticket.createdBySasUser.email || 'Cliente SAS'
    }
    if (ticket.contactName) return ticket.contactName
    return 'Cliente'
  }

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])

  return (
    <div>
      {loading && tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span>Cargando tickets...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No se encontraron tickets
        </div>
      ) : (
        <>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Contacto</TableHead>
                    {isAdmin && <TableHead>Asignado</TableHead>}
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => {
                    const priorityBadge = getPriorityBadge(ticket.priority as TicketPriority)
                    const statusBadge = getStatusBadge(ticket.status as TicketStatus)
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                        <TableCell>{ticket.organization.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getReporterLabel(ticket)}
                              </span>
                              {!ticket.createdBy && ticket.createdBySasUser && (
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                  SAS
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {ticket.createdBy
                                ? ticket.createdBy.email
                                : ticket.createdBySasUser?.email || ticket.contactEmail || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
                            {ticket.contactEmail && (
                              <span className="truncate">{ticket.contactEmail}</span>
                            )}
                            {ticket.contactPhone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {ticket.contactPhone}
                              </span>
                            )}
                            {!ticket.contactEmail && !ticket.contactPhone && (
                              <span className="text-xs text-gray-400">Sin datos</span>
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>{ticket.assignedTo?.fullName || ticket.assignedTo?.email || "-"}</TableCell>
                        )}
                        <TableCell>
                          <Badge className={priorityBadge.className}>
                            {ticket.priority === 'low' ? 'Baja' : 
                             ticket.priority === 'medium' ? 'Media' : 
                             ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewTicket(ticket)}
                                  className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalles</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total} tickets
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const SupportTicketsTable = memo(SupportTicketsTableComponent)
