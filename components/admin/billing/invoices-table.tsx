"use client"

import { useState } from "react"
import { InvoiceWithRelations, InvoiceFilters } from "@/lib/services/admin/billing-service"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Mail, FileText, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface InvoicesTableProps {
  invoices: InvoiceWithRelations[]
  loading: boolean
  onFiltersChange: (filters: InvoiceFilters) => void
  onRefresh: () => void
  onInvoiceClick?: (invoice: InvoiceWithRelations) => void
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  }

  const labels: Record<string, string> = {
    paid: "Pagada",
    pending: "Pendiente",
    overdue: "Vencida",
    cancelled: "Cancelada",
    refunded: "Reembolsada",
  }

  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  )
}

export const formatCurrency = (amount: number | string, currency: string = "USD") => { 
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount    
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(numAmount)
}

export const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

export function InvoicesTable({
  invoices,
  loading,
  onFiltersChange,
  onRefresh,
  onInvoiceClick,
}: InvoicesTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleSearch = () => {
    onFiltersChange({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    onFiltersChange({
      search: search || undefined,
      status: value !== "all" ? value : undefined,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No se encontraron facturas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Número de factura, nombre, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
        </div>
        <div className="w-full md:w-48">
          <Label htmlFor="status">Estado</Label>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Organización</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.billingName}</div>
                    <div className="text-xs text-gray-500">{invoice.billingEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.organization ? (
                    <div>
                      <div className="font-medium">{invoice.organization.name}</div>
                      <div className="text-xs text-gray-500">{invoice.organization.slug}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(invoice.total.toString(), invoice.currency)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(invoice.status)}
                </TableCell>
                <TableCell>
                  {formatDate(invoice.issueDate)}
                </TableCell>
                <TableCell>
                  <div className={invoice.dueDate < new Date() && invoice.status !== 'paid' ? 'text-red-600 dark:text-red-400' : ''}>
                    {formatDate(invoice.dueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInvoiceClick?.(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
