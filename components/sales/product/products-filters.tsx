"use client";

import { Branch } from "@prisma/client";
import { Search, X, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProductsFiltersProps {
  onPageSizeChange: (size: number) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (term: string) => void;
  statusValue?: string;
  isAdmin?: boolean;
  branches?: Branch[];
  selectedBranchId?: string | null;
  onBranchChange?: (branchId: string | null) => void;
  viewMode?: "table" | "grid";
  onViewModeChange?: (mode: "table" | "grid") => void;
}

export function ProductsFilters({
  onPageSizeChange,
  onStatusChange,
  onSearchChange,
  statusValue = "all",
  isAdmin = false,
  branches = [],
  selectedBranchId = null,
  onBranchChange,
  viewMode = "table",
  onViewModeChange,
}: ProductsFiltersProps) {const [searchValue, setSearchValue] = useState("");
  const isMobile = useIsMobile();

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      
      {/* Búsqueda */}
      <div className="flex-1 w-full sm:w-auto">
        <Label
          htmlFor="search-products"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          {"Buscar"}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="search-products"
            placeholder={"Buscar productos..."}
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
              <SelectValue placeholder={"Filtrar por estado"} />
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
       {/* Filtro de sucursal (solo para administradores) */}
       {isAdmin && branches.length > 0 && (
        <div className="w-full sm:w-[200px]">
          <Label
            htmlFor="branch-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Sucursal
          </Label>
          <Select
            value={selectedBranchId || "all"}
            onValueChange={(value) => {
              if (onBranchChange) {
                onBranchChange(value === "all" ? null : value);
              }
            }}
          >
            <SelectTrigger id="branch-filter" className="w-full rounded-full">
              <SelectValue placeholder="Todas las sucursales" />
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
        </div>
      )}

      {/* Selector de vista - solo visible en desktop */}
      <div className="hidden md:block w-full sm:w-auto">
        <Label
          htmlFor="view-mode"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Vista
        </Label>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (!value) return;
            onViewModeChange?.(value as "table" | "grid");
          }}
          className="rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-1 overflow-hidden"
          id="view-mode"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="table"
                aria-label="Vista en tabla"
                className={cn(
                  "!rounded-full px-3 py-2 transition-colors",
                  viewMode === "table"
                    ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-black"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2a2a2a]"
                )}
              >
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Vista en tabla</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="grid"
                aria-label="Vista en tarjetas"
                className={cn(
                  "!rounded-full px-3 py-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-black"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2a2a2a]"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Vista en tarjetas</TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </div>
  );
}
