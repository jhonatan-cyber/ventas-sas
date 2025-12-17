"use client"

import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { SupportContainer } from "./support-container"
import { SupportHeader } from "./support-header"
import { SupportTicketFormDialog } from "./support-ticket-form-dialog"

import { useSasPermissions } from "@/contexts/sas-permissions-context"

interface SupportTicketSummary {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  category: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    comments: number
  }
}

interface SupportPageClientProps {
  customerSlug: string
  currentUser: {
    id: string
    nombre?: string | null
    apellido?: string | null
    email?: string | null
    phone?: string | null
  }
  initialTickets: SupportTicketSummary[]
  initialTotal: number
  initialStats: {
    open: number
    inProgress: number
    resolved: number
    closed: number
  }
}

export function SupportTicketsPageClient({
  customerSlug,
  currentUser,
  initialTickets,
  initialTotal: _initialTotal,
  initialStats: _initialStats,
}: SupportPageClientProps) {
  // Hook para verificar permisos del usuario (soporte siempre disponible, pero por consistencia)
  const { hasPermission: _hasPermission } = useSasPermissions()
  
  const [allTickets, setAllTickets] = useState<SupportTicketSummary[]>(initialTickets)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const router = useRouter()

  // Filtrar tickets localmente por estado y búsqueda
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      // Filtrar por estado
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false
      }

      // Filtrar por búsqueda
      if (searchQuery && searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          ticket.ticketNumber.toLowerCase().includes(searchLower) ||
          ticket.title.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      return true
    })
  }, [allTickets, statusFilter, searchQuery])

  // Calcular tickets para la página actual
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentTickets = filteredTickets.slice(startIndex, endIndex)
  const total = filteredTickets.length
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  // Función para refrescar todos los tickets desde el backend
  const refreshTickets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/${customerSlug}/support/tickets?page=1&pageSize=1000`, {
        cache: "no-store",
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudieron cargar los tickets")
        return
      }

      setAllTickets(data.tickets)
      setPage(1)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("Error al cargar los tickets")
    } finally {
      setLoading(false)
    }
  }, [customerSlug])


  const handleCreateTicket = async (
    formData: {
      title: string
      description: string
      priority: string
      category: string
      contactEmail?: string
      contactPhone?: string
    },
    attachments: File[]
  ) => {
    try {
      setLoading(true)
      const body = new FormData()
      body.append("title", formData.title)
      body.append("description", formData.description)
      body.append("priority", formData.priority)
      body.append("category", formData.category)
      if (formData.contactEmail) body.append("contactEmail", formData.contactEmail)
      if (formData.contactPhone) body.append("contactPhone", formData.contactPhone)
      attachments.forEach((file) => body.append("attachments", file))

      const response = await fetch(`/api/${customerSlug}/support/tickets`, {
        method: "POST",
        body,
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo crear el ticket")
        return
      }

      toast.success("Ticket enviado correctamente")
      setIsFormOpen(false)
      await refreshTickets()
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticketId: string) => {
    router.push(`/${customerSlug}/support/${ticketId}`)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  // Verificar permisos para mostrar botones de acciones
  // Nota: El soporte siempre está disponible, pero mantenemos consistencia
  const canCreateTicket = true // Siempre permitido
  const _canViewTickets = true // Siempre permitido

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      <SupportHeader 
        title="Soporte técnico" 
        description="Gestiona tus tickets de soporte y obtén ayuda de nuestro equipo técnico"
        onNewClick={canCreateTicket ? () => setIsFormOpen(true) : undefined}
        loading={loading}
        showNewButton={canCreateTicket}
      />

      <SupportContainer
        tickets={currentTickets}
        total={total}
        allTickets={allTickets}
        loading={loading}
        onViewDetails={handleViewTicket}
        onRefresh={refreshTickets}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      <SupportTicketFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateTicket}
        defaultContactEmail={currentUser.email}
        defaultContactPhone={currentUser.phone}
        loading={loading}
      />

    </div>
  )
}

