"use client"

import { Search, XCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SalesFiltersProps {
  onPageSizeChange: (size: number) => void
  onSearchChange: (term: string) => void
  onStatusChange: (status: string) => void
  onPaymentMethodChange: (method: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  selectedStatus: string
  selectedPaymentMethod: string
  startDate: string
  endDate: string
}

const paymentOptions = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr', label: 'QR / Billetera' },
]

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
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
  selectedStatus,
  selectedPaymentMethod,
  startDate,
  endDate,
}: SalesFiltersProps) {
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
    <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <Label htmlFor="sales-search" className="text-xs font-medium text-gray-500 dark:text-gray-400">Buscar venta</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="sales-search"
                placeholder="Buscar por número, cliente o notas..."
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
            <div className="space-y-2 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center w-full block">Estado</Label>
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center w-full block">Método de pago</Label>
              <Select value={selectedPaymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {paymentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center w-full block">Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="rounded-full w-full"
              />
            </div>

            <div className="space-y-2 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center w-full block">Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="rounded-full w-full"
              />
            </div>

            <div className="space-y-2 min-w-[140px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center w-full block">Por página</Label>
              <Select onValueChange={(value) => onPageSizeChange(Number(value))} defaultValue="10">
                <SelectTrigger className="rounded-full w-full">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="5">5 registros</SelectItem>
                  <SelectItem value="10">10 registros</SelectItem>
                  <SelectItem value="20">20 registros</SelectItem>
                  <SelectItem value="50">50 registros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
