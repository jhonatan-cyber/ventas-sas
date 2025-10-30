"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface CustomersFiltersProps {
  onPageSizeChange?: (pageSize: number) => void
  onStatusChange?: (status: string) => void
  onSearchChange?: (searchTerm: string) => void
}

export function CustomersFilters({ onPageSizeChange, onStatusChange, onSearchChange }: CustomersFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState("5")
  const [status, setStatus] = useState("all")

  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
    onPageSizeChange?.(parseInt(value))
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onStatusChange?.(value)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearchChange?.(value)
  }
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar clientes..."
              className="pl-10 bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Selector de estado */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Estado" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Todos</SelectItem>
            <SelectItem value="active" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Activos</SelectItem>
            <SelectItem value="inactive" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        {/* Selector de datos por página */}
        <Select value={pageSize} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectValue placeholder="Por página" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="5" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">5 por página</SelectItem>
            <SelectItem value="10" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">10 por página</SelectItem>
            <SelectItem value="20" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">20 por página</SelectItem>
            <SelectItem value="50" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

