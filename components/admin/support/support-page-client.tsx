"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SupportFilters } from "./support-filters"
import { SupportPageHeader } from "./support-page-header"
import { SupportStats } from "./support-stats"
import { SupportTicketsTable } from "./support-tickets-table"
import { TicketFormDialog } from "./ticket-form-dialog"

import { TicketFilters } from "@/lib/services/admin/support-service"

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
  isAdmin?: boolean
}

export function SupportPageClient({
  initialTickets,
  initialTotal,
  initialStats,
  organizations,
  admins,
  isAdmin = true,
}: SupportPageClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<TicketStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [filters, setFilters] = useState<TicketFilters>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false)
  const router = useRouter()

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchTickets = useCallback(async () => {
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
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery)

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
  }, [filters, page, pageSize, debouncedSearchQuery])

  const fetchStats = useCallback(async () => {
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
  }, [filters.organizationId])

  // Solo hacer fetch cuando cambien los filtros, búsqueda o página
  // No hacer fetch en el montaje inicial ya que tenemos datos iniciales del servidor
  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  useEffect(() => {
    if (isInitialMount) {
      return
    }
    void fetchTickets()
  }, [fetchTickets, isInitialMount])

  useEffect(() => {
    if (isInitialMount) {
      return
    }
    void fetchStats()
  }, [fetchStats, isInitialMount])

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

  const handleViewTicket = useCallback(async (ticket: Ticket) => {
    router.push(`/administracion/support/${ticket.id}`)
  }, [router])

  const handleFiltersChange = useCallback((newFilters: TicketFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  // Memorizar las props de la tabla para evitar re-renderizados innecesarios
  const tableProps = useMemo(() => ({
    tickets,
    total,
    loading,
    page,
    pageSize,
    onViewTicket: handleViewTicket,
    onPageChange: handlePageChange,
    isAdmin,
  }), [tickets, total, loading, page, pageSize, handleViewTicket, handlePageChange, isAdmin])

  return (
    <div className="space-y-6">
      <SupportPageHeader onNewTicketClick={() => setIsTicketFormOpen(true)} />

      <SupportStats stats={stats} />

      <SupportFilters
        filters={filters}
        searchQuery={searchQuery}
        organizations={organizations}
        admins={admins}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        isAdmin={isAdmin}
      />

      <SupportTicketsTable {...tableProps} />

      <TicketFormDialog
        open={isTicketFormOpen}
        onOpenChange={setIsTicketFormOpen}
        organizations={organizations}
        onSave={handleSaveTicket}
        loading={loading}
      />

    </div>
  )
}
