"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
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

interface CashRegistersFiltersProps {
  branches: Array<{ id: string; name: string }>;
  onPageSizeChange: (size: number) => void;
  onStatusChange: (status: string) => void;
  onBranchChange: (branch: string) => void;
  onSearchChange: (term: string) => void;
  maxBranches?: number | null;
}

export function CashRegistersFilters({
  branches,
  onPageSizeChange,
  onStatusChange,
  onBranchChange,
  onSearchChange,
  maxBranches,
}: CashRegistersFiltersProps) {
  const t = useTranslations()
  const [searchValue, setSearchValue] = useState("");
  const showBranchFilter =
    maxBranches === undefined || maxBranches === null || maxBranches > 1;

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
          htmlFor="cash-register-search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          {t('common.search')}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="cash-register-search"
            placeholder={t('common.placeholders.searchCashRegisters')}
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

      {/* Filtro de sucursal */}
      {showBranchFilter && (
        <div className="w-full sm:w-[200px]">
          <Label
            htmlFor="branch-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Sucursal
          </Label>
          <Select onValueChange={onBranchChange} defaultValue="all">
            <SelectTrigger id="branch-filter" className="w-full rounded-full">
              <SelectValue placeholder={t('common.placeholders.filterByBranch')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.placeholders.allBranches')}</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filtros de estado y datos */}
      <div className="grid grid-cols-2 gap-3 sm:contents w-full">
        {/* Filtro de estado */}
        <div className="w-full sm:w-[150px]">
          <Label
            htmlFor="status-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Estado
          </Label>
          <Select onValueChange={onStatusChange} defaultValue="all">
            <SelectTrigger id="status-filter" className="w-full rounded-full">
              <SelectValue placeholder={t('common.placeholders.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="open">Abiertas</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tamaño de página */}
        <div className="w-full sm:w-[200px]">
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
              <SelectValue placeholder={t('common.placeholders.perPage')} />
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
  );
}
