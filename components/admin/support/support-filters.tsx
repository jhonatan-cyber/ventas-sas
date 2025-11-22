"use client"

import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  isAdmin?: boolean
}

export function SupportFilters({
  filters,
  searchQuery,
  organizations,
  admins,
  onFiltersChange,
  onSearchChange,
  isAdmin = true,
}: SupportFiltersProps) {
  return (
    <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
  
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="mb-2 block">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar por número, título o descripción..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onSearchChange("")}
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </Button>
              )}
            </div>
          </div>

          <div className="min-w-[180px]">
            <Label htmlFor="organization" className="mb-2 block">Organización</Label>
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

          <div className="min-w-[150px]">
            <Label htmlFor="status" className="mb-2 block">Estado</Label>
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

          <div className="min-w-[150px]">
            <Label htmlFor="priority" className="mb-2 block">Prioridad</Label>
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

          {isAdmin && (
            <div className="min-w-[180px]">
              <Label htmlFor="assignedTo" className="mb-2 block">Asignado</Label>
              <Select
                value={filters.assignedToId === null ? "unassigned" : filters.assignedToId || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    const { assignedToId: _assignedToId, ...rest } = filters
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}
