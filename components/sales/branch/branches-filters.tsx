"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BranchesFiltersProps {
  onPageSizeChange: (size: number) => void
  onStatusChange: (status: string) => void
  onSearchChange: (term: string) => void
  statusValue?: string
}

export function BranchesFilters({
  onPageSizeChange,
  onStatusChange,
  onSearchChange,
  statusValue = "all",
}: BranchesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      {/* Búsqueda */}
      <div className="flex-1 w-full sm:w-auto">
        <Label
          htmlFor="search-branches"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="search-branches"
            placeholder="Buscar sucursales por nombre, dirección, teléfono, email..."
            className="pl-10 w-full"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

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
          <SelectTrigger id="status-filter" className="w-full">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Solo activas</SelectItem>
            <SelectItem value="inactive">Solo inactivas</SelectItem>
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
          <SelectTrigger id="page-size" className="w-full">
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
  )
}

