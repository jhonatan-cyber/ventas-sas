"use client"

import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type BranchOption = {
  id: string
  name: string | null
}

const statusOptions = [
  { value: 'all', label: 'Todos los estados', shortLabel: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'converted', label: 'Convertidas' },
  { value: 'expired', label: 'Vencidas' },
]

export interface QuotationsFiltersProps {
  onPageSizeChange: (size: number) => void
  onStatusChange: (status: string) => void
  onSearchChange: (term: string) => void
  statusValue?: string
  branches?: BranchOption[]
  selectedBranchId?: string | null
  onBranchChange?: (branchId: string | null) => void
  showBranchFilter?: boolean
  maxBranches?: number | null
}

export function QuotationsFilters({
  onPageSizeChange,
  onStatusChange,
  onSearchChange,
  statusValue = "all",
  branches = [],
  selectedBranchId = null,
  onBranchChange,
  showBranchFilter = false,
  maxBranches: _maxBranches,
}: QuotationsFiltersProps) {const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const handleClearSearch = () => {
    setSearchValue("")
    onSearchChange("")
  }

  const { branchOptions, hasUnassignedBranch } = useMemo(() => {
    const unique = new Map<string, BranchOption>()
    let includeUnassigned = false

    branches.forEach((branch) => {
      if (!branch) {
        return
      }

      if (branch.id === "none" || !branch.id) {
        includeUnassigned = true
        return
      }

      if (!unique.has(branch.id)) {
        unique.set(branch.id, { id: branch.id, name: branch.name ?? "Sin nombre" })
      }
    })

    return {
      branchOptions: Array.from(unique.values()),
      hasUnassignedBranch:
        includeUnassigned || branches.some((branch) => branch?.id === "none"),
    }
  }, [branches])

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <Label
              htmlFor="quotations-search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <Input
                id="quotations-search"
                placeholder={"Buscar cotizaciones..."}
                className="pl-10 pr-10 w-full rounded-full"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={handleClearSearch}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </Button>
              )}
            </div>
          </div>

          {showBranchFilter && (branchOptions.length > 0 || hasUnassignedBranch) && (
            <div className="w-full sm:w-[200px]">
              <Label
                htmlFor="branch-filter"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Sucursal
              </Label>
              <Select
                value={selectedBranchId ?? "all"}
                onValueChange={(value) => {
                  if (onBranchChange) {
                    if (value === "all") {
                      onBranchChange(null)
                      return
                    }

                    if (value === "none") {
                      onBranchChange("none")
                      return
                    }

                    onBranchChange(value)
                  }
                }}
              >
                <SelectTrigger id="branch-filter" className="w-full rounded-full">
                  <SelectValue placeholder={"Todas las sucursales"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"Todas las sucursales"}</SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name ?? "Sin nombre"}
                    </SelectItem>
                  ))}
                  {hasUnassignedBranch && (
                    <SelectItem value="none">{"Sin sucursal"}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Estado y Datos en fila de 2 en móvil */}
          <div className="grid grid-cols-2 gap-3 w-full sm:contents">
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
                  <SelectValue placeholder={"Filtrar por estado"} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="sm:hidden">{option.shortLabel || option.label}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectValue placeholder={"Por página"} />
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