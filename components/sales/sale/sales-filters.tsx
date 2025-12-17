"use client"

import { Search, XCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SalesBranchSummary {
  id: string
  name: string | null
}

interface SalesFiltersProps {
  onPageSizeChange: (size: number) => void
  onSearchChange: (term: string) => void
  onStatusChange: (status: string) => void
  onPaymentMethodChange: (method: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onBranchChange?: (branchId: string) => void
  selectedStatus: string
  selectedPaymentMethod: string
  selectedBranch?: string
  startDate: string
  endDate: string
  branches?: SalesBranchSummary[]
  maxBranches?: number
}

const paymentOptions = [
  { value: 'all', label: 'Todos los métodos', shortLabel: 'Todos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr', label: 'QR / Billetera' },
]

const statusOptions = [
  { value: 'all', label: 'Todos los estados', shortLabel: 'Todos' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Anulada' },
]

export function SalesFilters({
  onPageSizeChange,
  onSearchChange,
  onStatusChange,
  onPaymentMethodChange,
  onStartDateChange,
  onEndDateChange,
  onBranchChange,
  selectedStatus,
  selectedPaymentMethod,
  selectedBranch = "all",
  startDate,
  endDate,
  branches = [],
  maxBranches,
}: SalesFiltersProps) {
  const showBranchFilter = maxBranches === undefined || maxBranches > 1
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const clearSearch = () => {
    setSearchValue("")
    onSearchChange("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <Label htmlFor="sales-search" className="text-xs font-medium text-gray-500 dark:text-gray-400">Buscar venta</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="sales-search"
              placeholder="Buscar por número de venta, cliente..."
              className="pl-12 pr-12 rounded-full"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-center gap-3">
          {/* Filtro de sucursal - Solo mostrar si el plan tiene más de una sucursal */}
          {showBranchFilter && onBranchChange && branches.length > 0 && (
            <div className="space-y-2 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Sucursal</Label>
              <Select value={selectedBranch} onValueChange={onBranchChange}>
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name || "Sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Estado y Método de pago en fila de 2 en móvil */}
          <div className="grid grid-cols-2 gap-3 w-full sm:contents">
            <div className="space-y-2 sm:min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Estado</Label>
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="sm:hidden">{option.shortLabel || option.label}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Método de pago</Label>
              <Select value={selectedPaymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {paymentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="sm:hidden">{option.shortLabel || option.label}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas en una sola línea en móvil */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:min-w-[160px]">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Desde</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="rounded-full w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&:invalid:not(:focus)]:text-transparent"
                  data-placeholder="dd/mm/aaaa"
                />
                {!startDate && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm select-none sm:hidden">
                    dd/mm/aaaa
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Hasta</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="rounded-full w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&:invalid:not(:focus)]:text-transparent"
                  data-placeholder="dd/mm/aaaa"
                />
                {!endDate && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm select-none sm:hidden">
                    dd/mm/aaaa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 min-w-[140px]">
            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left w-full block">Datos</Label>
            <Select onValueChange={(value) => onPageSizeChange(Number(value))} defaultValue="10">
              <SelectTrigger className="rounded-full w-full">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
