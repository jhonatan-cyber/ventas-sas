"use client"

import { Search, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"

interface SalesCustomersFiltersProps {
  onPageSizeChange: (size: number) => void
  onStatusChange: (status: string) => void
  onSearchChange: (term: string) => void
  statusValue?: string
}

export function SalesCustomersFilters({ 
  onPageSizeChange, 
  onStatusChange, 
  onSearchChange,
  statusValue = "all"
}: SalesCustomersFiltersProps) {
  const [searchValue, setSearchValue] = useState("")
  const isMobile = useIsMobile()

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const handleClear = () => {
    setSearchValue("")
    onSearchChange("")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      {/* Búsqueda */}
      <div className="flex-1 w-full sm:w-auto">
        <Label
          htmlFor="search-customers"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="search-customers"
            placeholder="Buscar clientes..."
            className="pl-10 pr-10 w-full rounded-full"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              onClick={handleClear}
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
            onValueChange={onStatusChange}
            value={statusValue}
            defaultValue="all"
          >
            <SelectTrigger id="status-filter" className="w-full rounded-full">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isMobile ? "Todos" : "Todos los estados"}</SelectItem>
              <SelectItem value="active">{isMobile ? "Activos" : "Solo activos"}</SelectItem>
              <SelectItem value="inactive">{isMobile ? "Inactivos" : "Solo inactivos"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tamaño de página */}
        <div className="w-full sm:w-[150px]">
          <Label
            htmlFor="page-size"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Datos
          </Label>
          <Select
            onValueChange={(value) => onPageSizeChange(Number(value))}
            defaultValue="10"
          >
            <SelectTrigger id="page-size" className="w-full rounded-full">
              <SelectValue placeholder="Por página" />
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
  )
}

