"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface CashRegistersFiltersProps {
  branches: Array<{ id: string; name: string }>
  onPageSizeChange: (size: number) => void
  onStatusChange: (status: string) => void
  onBranchChange: (branch: string) => void
  onSearchChange: (term: string) => void
}

export function CashRegistersFilters({ branches, onPageSizeChange, onStatusChange, onBranchChange, onSearchChange }: CashRegistersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Búsqueda */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre o sucursal"
          className="pl-10 rounded-full"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filtro de estado */}
      <Select onValueChange={onStatusChange} defaultValue="all">
        <SelectTrigger className="w-full sm:w-[180px] rounded-full">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="open">Abiertas</SelectItem>
          <SelectItem value="closed">Cerradas</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de sucursal */}
      <Select onValueChange={onBranchChange} defaultValue="all">
        <SelectTrigger className="w-full sm:w-[180px] rounded-full">
          <SelectValue placeholder="Filtrar por sucursal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las sucursales</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tamaño de página */}
      <Select onValueChange={(value) => onPageSizeChange(Number(value))} defaultValue="10">
        <SelectTrigger className="w-full sm:w-[150px] rounded-full">
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
  )
}

