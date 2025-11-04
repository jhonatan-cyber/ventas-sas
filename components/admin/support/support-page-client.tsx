"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { TicketFilters } from "@/lib/services/admin/support-service"
import { SupportStats } from "./support-stats"
import { SupportFilters } from "./support-filters"
import { SupportTicketsTable } from "./support-tickets-table"
import { TicketFormDialog } from "./ticket-form-dialog"
import { TicketDetailDialog } from "./ticket-detail-dialog"

interface Organization {
  id: string
  name: string
  slug: string
}

interface Admin {
  id: string
  fullName: string | null
  email: string
}

interface Ticket {
  id: string
  ticketNumber: string
  organizationId: string
  createdById: string | null
  assignedToId: string | null
  title: string
  description: string
  status: string
  priority: string
  category: string | null
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

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  averageResponseTime: number
  averageResolutionTime: number
}

interface SupportPageClientProps {
  initialTickets: Ticket[]
  initialTotal: number
  initialStats: TicketStats
  organizations: Organization[]
  admins: Admin[]
}

export function SupportPageClient({
  initialTickets,
  initialTotal,
  initialStats,
  organizations,
  admins,
}: SupportPageClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<TicketStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<TicketFilters>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false)
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())

      if (filters.organizationId) params.set("organizationId", filters.organizationId)
      if (filters.assignedToId !== undefined) {
        if (filters.assignedToId === null) {
          params.set("assignedToId", "null")
        } else {
          params.set("assignedToId", filters.assignedToId)
        }
      }
      if (filters.status) params.set("status", filters.status)
      if (filters.priority) params.set("priority", filters.priority)
      if (filters.category) params.set("category", filters.category)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/administracion/support/tickets?` + params.toString())
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
        setTotal(data.total)
      } else {
        toast.error(data.message || "Error al cargar tickets")
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("Error al cargar tickets")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const orgParam = filters.organizationId ? `?organizationId=${filters.organizationId}` : ''
      const response = await fetch(`/api/administracion/support/stats${orgParam}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/administracion/support/tickets/` + ticketId)
      const data = await response.json()

      if (data.success) {
        setSelectedTicketDetails(data.ticket)
      } else {
        toast.error(data.message || "Error al cargar detalles del ticket")
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error)
      toast.error("Error al cargar detalles del ticket")
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, JSON.stringify(filters), searchQuery])

  const handleSaveTicket = async (formData: {
    organizationId: string
    title: string
    description: string
    priority: string
    category: string
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/administracion/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Ticket creado exitosamente")
        setIsTicketFormOpen(false)
        fetchTickets()
        fetchStats()
      } else {
        toast.error(data.message || "Error al crear ticket")
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Error al crear ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (updates: any) => {
    if (!selectedTicket) return

    setLoading(true)
    try {
      const response = await fetch(`/api/administracion/support/tickets/` + selectedTicket.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Ticket actualizado exitosamente")
        if (selectedTicketDetails) {
          fetchTicketDetails(selectedTicket.id)
        }
        fetchTickets()
        fetchStats()
      } else {
        toast.error(data.message || "Error al actualizar ticket")
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Error al actualizar ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!selectedTicket) return

    try {
      const response = await fetch(`/api/administracion/support/tickets/` + selectedTicket.id + `/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          isInternal,
          authorType: 'admin',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Comentario agregado exitosamente")
        if (selectedTicket) {
          fetchTicketDetails(selectedTicket.id)
        }
        fetchTickets()
      } else {
        toast.error(data.message || "Error al agregar comentario")
        throw new Error(data.message || "Error al agregar comentario")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Error al agregar comentario")
      throw error
    }
  }

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsTicketDetailOpen(true)
    await fetchTicketDetails(ticket.id)
  }

  const handleFiltersChange = (newFilters: TicketFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <SupportStats stats={stats} />

      <SupportFilters
        filters={filters}
        searchQuery={searchQuery}
        organizations={organizations}
        admins={admins}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        onNewTicketClick={() => setIsTicketFormOpen(true)}
      />

      <SupportTicketsTable
        tickets={tickets}
        total={total}
        loading={loading}
        page={page}
        pageSize={pageSize}
        onViewTicket={handleViewTicket}
        onPageChange={setPage}
      />

      <TicketFormDialog
        open={isTicketFormOpen}
        onOpenChange={setIsTicketFormOpen}
        organizations={organizations}
        onSave={handleSaveTicket}
        loading={loading}
      />

      <TicketDetailDialog
        open={isTicketDetailOpen}
        onOpenChange={setIsTicketDetailOpen}
        ticket={selectedTicketDetails}
        admins={admins}
        onUpdate={handleUpdateTicket}
        onAddComment={handleAddComment}
        loading={loading}
      />
    </div>
  )
}
