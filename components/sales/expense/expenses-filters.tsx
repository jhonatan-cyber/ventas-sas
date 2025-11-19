"use client";

import { Search, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ExpenseBranchSummary } from "./types";

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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDateWithPreferences } from "@/lib/utils/preferences";

interface ExpensesFiltersProps {
  branches: ExpenseBranchSummary[];
  onPageSizeChange: (size: number) => void;
  onBranchChange: (branchId: string) => void;
  onSearchChange: (term: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  selectedBranch: string;
  branchLabel?: string;
  startDate: string;
  endDate: string;
  showBranchFilter?: boolean;
  customerSlug: string;
}

export function ExpensesFilters({
  branches,
  onPageSizeChange,
  onBranchChange,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  selectedBranch,
  branchLabel = "Todas las sucursales",
  startDate,
  endDate,
  showBranchFilter = true,
  customerSlug,
}: ExpensesFiltersProps) {
  const t = useTranslations()
  const [searchValue, setSearchValue] = useState("");
  const isMobile = useIsMobile();

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      {/* Búsqueda */}
      <div className="flex-1 w-full sm:min-w-[300px] md:min-w-[400px]">
        <Label
          htmlFor="expense-search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="expense-search"
            placeholder={t('common.placeholders.searchExpenses')}
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
              onClick={clearSearch}
            >
              <XCircle className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtro de sucursal */}
      {showBranchFilter && (
        <div className="w-full sm:w-[180px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Sucursal
          </Label>
          <Select value={selectedBranch} onValueChange={onBranchChange}>
            <SelectTrigger className="w-full rounded-full">
              <SelectValue placeholder={t('common.placeholders.allBranches')}>
                {branchLabel || "Todas las sucursales"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.placeholders.allBranches')}</SelectItem>
              {branches.map((branch) => (
                <SelectItem
                  key={branch.id || "default"}
                  value={branch.id || "none"}
                >
                  {branch.name || t('branches.details.noName')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filtros de fecha */}
      <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:gap-4">
        <div className="w-full sm:w-[150px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Desde
          </Label>
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={cn(
                "w-full rounded-full",
                // En móviles: ocultar el indicador y los campos de fecha nativos
                isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-datetime-edit-text]:opacity-0 [&::-webkit-datetime-edit-month-field]:opacity-0 [&::-webkit-datetime-edit-day-field]:opacity-0 [&::-webkit-datetime-edit-year-field]:opacity-0 [&::-webkit-inner-spin-button]:opacity-0 [&::-webkit-outer-spin-button]:opacity-0",
                // En PC: mostrar todo normalmente
                !isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
              )}
              style={startDate && isMobile ? { color: 'transparent', caretColor: 'transparent' } : undefined}
            />
            {!startDate && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                <span className="text-sm text-gray-400">dd/mm/aaa</span>
              </div>
            )}
            {startDate && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                <span className="text-sm text-gray-900 dark:text-white">
                  {(() => {
                    const [year, month, day] = startDate.split('-').map(Number)
                    const localDate = new Date(year, month - 1, day)
                    return formatDateWithPreferences(localDate, customerSlug)
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full sm:w-[150px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Hasta
          </Label>
          <div className="relative">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={cn(
                "w-full rounded-full",
                // En móviles: ocultar el indicador y los campos de fecha nativos
                isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-datetime-edit-text]:opacity-0 [&::-webkit-datetime-edit-month-field]:opacity-0 [&::-webkit-datetime-edit-day-field]:opacity-0 [&::-webkit-datetime-edit-year-field]:opacity-0 [&::-webkit-inner-spin-button]:opacity-0 [&::-webkit-outer-spin-button]:opacity-0",
                // En PC: mostrar todo normalmente
                !isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
              )}
              style={endDate && isMobile ? { color: 'transparent', caretColor: 'transparent' } : undefined}
            />
            {!endDate && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                <span className="text-sm text-gray-400">dd/mm/aaa</span>
              </div>
            )}
            {endDate && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                <span className="text-sm text-gray-900 dark:text-white">
                  {(() => {
                    const [year, month, day] = endDate.split('-').map(Number)
                    const localDate = new Date(year, month - 1, day)
                    return formatDateWithPreferences(localDate, customerSlug)
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tamaño de página */}
      <div className="w-full sm:w-[150px]">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Datos
        </Label>
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          defaultValue="10"
        >
          <SelectTrigger className="w-full rounded-full">
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
  );
}
