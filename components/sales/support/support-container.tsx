"use client"

import { Eye, Search, X, HelpCircle } from "lucide-react"

import { SupportSasCards } from "./support-sas-cards"
import { SupportSasStats } from "./support-sas-stats"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface SupportContainerProps {
  tickets: SupportTicketSummary[]
  total: number
  allTickets: SupportTicketSummary[]
  loading?: boolean
  onViewDetails: (ticketId: string) => void
  onRefresh: () => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
}

export function SupportContainer({ 
  tickets, 
  total,
  allTickets,
  loading = false, 
  onViewDetails,
  onRefresh: _onRefresh,
  page,
  totalPages,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  pageSize,
  onPageSizeChange
}: SupportContainerProps) {
  const STATUS_TABS: Array<{ value: "all" | "open" | "in_progress" | "resolved" | "closed"; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "open", label: "Abiertos" },
    { value: "in_progress", label: "En progreso" },
    { value: "resolved", label: "Resueltos" },
    { value: "closed", label: "Cerrados" },
  ]

  const PRIORITY_BADGE: Record<string, string> = {
    low: "bg-blue-100 text-blue-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  }

  const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas */}
      <SupportSasStats tickets={allTickets} />

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Búsqueda */}
            <div className="flex-1 w-full sm:w-auto">
              <Label
                htmlFor="search-support"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  id="search-support"
                  placeholder="Buscar por número o título..."
                  className="pl-10 pr-10 w-full rounded-full"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => onSearchChange("")}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filtro de estado y Tamaño de página - En móvil en grid de 2 columnas */}
            <div className="grid grid-cols-2 gap-4 w-full sm:contents">
              {/* Filtro de estado */}
              <div className="w-full sm:w-[180px]">
                <Label
                  htmlFor="status-filter"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                >
                  Estado
                </Label>
                <Select
                  onValueChange={onStatusFilterChange}
                  value={statusFilter}
                  defaultValue="all"
                >
                  <SelectTrigger id="status-filter" className="w-full rounded-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TABS.map((tab) => (
                      <SelectItem key={tab.value} value={tab.value}>
                        {tab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tamaño de página */}
              <div className="w-full sm:w-[150px]">
                <Label
                  htmlFor="page-size"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                >
                  Mostrar
                </Label>
                <Select
                  onValueChange={(value) => onPageSizeChange(Number(value))}
                  value={String(pageSize)}
                  defaultValue="10"
                >
                  <SelectTrigger id="page-size" className="w-full rounded-full">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar cards y tabla solo si hay tickets */}
      {tickets.length > 0 ? (
        <>
          {/* Cards de tickets (solo móvil) */}
          <SupportSasCards tickets={tickets} onViewDetails={onViewDetails} />

          {/* Tabla de tickets (solo desktop) */}
          <div className="hidden md:block rounded-xl border bg-white dark:bg-[#1a1a1a]">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead>Comentarios</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{ticket.title}</span>
                    <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_TABS.find((t) => t.value === ticket.status)?.label || ticket.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={PRIORITY_BADGE[ticket.priority] || ""}>
                    {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(ticket.updatedAt).toLocaleString("es-BO")}
                </TableCell>
                <TableCell>{ticket._count?.comments ?? 0}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          onClick={() => onViewDetails(ticket.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalles</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {loading ? 'Cargando tickets...' : 'No hay tickets de soporte'}
            </p>
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="flex justify-center pt-4">
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={pageSize}
            showPageSizeSelector={false}
          />
        </div>
      )}
    </div>
  )
}

