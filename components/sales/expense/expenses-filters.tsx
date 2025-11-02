"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, XCircle } from "lucide-react"
import { ExpenseBranchSummary } from "./types"
import { useState } from "react"

interface ExpensesFiltersProps {
  branches: ExpenseBranchSummary[]
  onPageSizeChange: (size: number) => void
  onBranchChange: (branchId: string) => void
  onSearchChange: (term: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  selectedBranch: string
  startDate: string
  endDate: string
  showBranchFilter?: boolean
}

export function ExpensesFilters({
  branches,
  onPageSizeChange,
  onBranchChange,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  selectedBranch,
  startDate,
  endDate,
  showBranchFilter = true,
}: ExpensesFiltersProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const clearSearch = () => {
    setSearchValue("")
    onSearchChange("")
  }

  const filtersWrapperClass = showBranchFilter
    ? "flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3"
    : "flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3"

  return (
    <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <Label htmlFor="expense-search" className="text-xs font-medium text-gray-500 dark:text-gray-400">Buscar gasto</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="expense-search"
                placeholder="Buscar por concepto, descripción o responsable..."
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

          <div className={filtersWrapperClass}>
            {showBranchFilter && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sucursal</Label>
                <Select value={selectedBranch} onValueChange={onBranchChange}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    <SelectItem value="none">Sin sucursal</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id || "default"} value={branch.id || "none"}>
                        {branch.name || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-[180px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2 flex-1 min-w-[180px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2 min-w-[150px]">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Por página</Label>
              <Select onValueChange={(value) => onPageSizeChange(Number(value))} defaultValue="10">
                <SelectTrigger className="rounded-full">
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

