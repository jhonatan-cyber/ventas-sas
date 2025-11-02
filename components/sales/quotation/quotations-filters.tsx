"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export interface QuotationsFiltersProps {
  onPageSizeChange: (size: number) => void
  onSearchChange: (term: string) => void
  onStatusChange?: (status: string) => void
}

export function QuotationsFilters({ onPageSizeChange, onSearchChange, onStatusChange }: QuotationsFiltersProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (term: string) => {
    setSearchValue(term)
    onSearchChange(term)
  }

  const handleClearSearch = () => {
    setSearchValue("")
    onSearchChange("")
  }

  return (
    <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#101010]/80 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="quotation-search" className="text-xs font-medium text-gray-500 dark:text-gray-400">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="quotation-search"
                placeholder="Buscar por número, cliente o notas..."
                className="mt-1 pl-12 pr-12 rounded-full"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</Label>
              <Select onValueChange={(value) => onStatusChange?.(value)} defaultValue="all">
                <SelectTrigger className="mt-1 w-full rounded-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="expired">Vencidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Por página</Label>
              <Select onValueChange={(value) => onPageSizeChange(Number(value))} defaultValue="10">
                <SelectTrigger className="mt-1 w-full rounded-full">
                  <SelectValue placeholder="Por página" />
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
      </CardContent>
    </Card>
  )
}

