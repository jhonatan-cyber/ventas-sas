"use client";

import { Search, XCircle } from "lucide-react";
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
}: ExpensesFiltersProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap">
        <div className="flex flex-col gap-2 flex-[2] min-w-[260px]">
          <Label
            htmlFor="expense-search"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              id="expense-search"
              placeholder="Buscar por concepto, descripción o responsable..."
              className="pl-10 pr-12 rounded-full"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 transform rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showBranchFilter && (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sucursal
            </Label>
            <Select value={selectedBranch} onValueChange={onBranchChange}>
              <SelectTrigger className="rounded-full w-full md:w-[180px]">
                <SelectValue placeholder="Todas las sucursales">{branchLabel || "Todas las sucursales"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {branches.map((branch) => (
                  <SelectItem
                    key={branch.id || "default"}
                    value={branch.id || "none"}
                  >
                    {branch.name || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-[175px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Desde
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-full"
          />
        </div>

        <div className="flex flex-col gap-2 min-w-[175px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hasta
          </Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-full"
          />
        </div>

        <div className="flex flex-col gap-2 min-w-[150px]">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Datos
          </Label>
          <Select
            onValueChange={(value) => onPageSizeChange(Number(value))}
            defaultValue="10"
          >
            <SelectTrigger className="rounded-full">
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
  );
}
