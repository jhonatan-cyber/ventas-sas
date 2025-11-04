"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { TicketStatus, TicketPriority, TicketFilters } from "@/lib/services/admin/support-service"

interface Organization {
  id: string
  name: string
}

interface Admin {
  id: string
  fullName: string | null
  email: string
}

interface SupportFiltersProps {
  filters: TicketFilters
  searchQuery: string
  organizations: Organization[]
  admins: Admin[]
  onFiltersChange: (filters: TicketFilters) => void
  onSearchChange: (query: string) => void
  onNewTicketClick: () => void
}

export function SupportFilters({
  filters,
  searchQuery,
  organizations,
  admins,
  onFiltersChange,
  onSearchChange,
  onNewTicketClick,
}: SupportFiltersProps) {
  return (
    <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros y Búsqueda
          </CardTitle>
          <Button onClick={onNewTicketClick} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar por número, título o descripción..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="organization">Organización</Label>
            <Select
              value={filters.organizationId || "all"}
              onValueChange={(value) => {
                onFiltersChange({ ...filters, organizationId: value === "all" ? undefined : value })
              }}
            >
              <SelectTrigger className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las organizaciones</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => {
                onFiltersChange({ ...filters, status: value === "all" ? undefined : value as TicketStatus })
              }}
            >
              <SelectTrigger className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Prioridad</Label>
            <Select
              value={filters.priority || "all"}
              onValueChange={(value) => {
                onFiltersChange({ ...filters, priority: value === "all" ? undefined : value as TicketPriority })
              }}
            >
              <SelectTrigger className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignedTo">Asignado</Label>
            <Select
              value={filters.assignedToId === null ? "unassigned" : filters.assignedToId || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  const { assignedToId, ...rest } = filters
                  onFiltersChange(rest)
                } else if (value === "unassigned") {
                  onFiltersChange({ ...filters, assignedToId: null })
                } else {
                  onFiltersChange({ ...filters, assignedToId: value })
                }
              }}
            >
              <SelectTrigger className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.fullName || admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
