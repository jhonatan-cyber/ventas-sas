"use client";
import { useEffect, useMemo, useState } from "react";

import { ExpensesFilters } from "./expenses-filters";
import { ExpensesPagination } from "./expenses-pagination";
import { ExpensesStats } from "./expenses-stats";
import { ExpensesTable } from "./expenses-table";
import { ExpenseBranchSummary, SalesExpenseWithRelations } from "./types";

import { Card, CardContent } from "@/components/ui/card";

interface ExpensesContainerProps {
  expenses: SalesExpenseWithRelations[];
  branches: ExpenseBranchSummary[];
  isLoading?: boolean;
  isAdmin: boolean;
  userBranchId?: string | null;
  onEdit?: (expense: SalesExpenseWithRelations) => void;
  onDelete?: (expense: SalesExpenseWithRelations) => void;
}

export function ExpensesContainer({
  expenses,
  branches,
  isLoading = false,
  isAdmin,
  userBranchId = null,
  onEdit,
  onDelete,
}: ExpensesContainerProps) {

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branchFilterLabel, setBranchFilterLabel] = useState<string>("Todas las sucursales");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hasInitialFilter, setHasInitialFilter] = useState(false);

  const branchOptions = useMemo(() => branches ?? [], [branches]);

  useEffect(() => {
    if (branchOptions.length <= 1 && branchFilter !== "all") {
      setBranchFilter("all");
      setBranchFilterLabel("Todas las sucursales");
    }
  }, [branchOptions.length, branchFilter]);

  useEffect(() => {
    if (hasInitialFilter) return;

    if (isAdmin) {
      setBranchFilter("all");
      setBranchFilterLabel("Todas las sucursales");
      setHasInitialFilter(true);
      return;
    }

    if (userBranchId) {
      setBranchFilter(userBranchId);
      const branchName =
        branchOptions.find((branch) => branch.id === userBranchId)?.name ||
        "Mi sucursal";
      setBranchFilterLabel(branchName);
      setHasInitialFilter(true);
      return;
    }

    setBranchFilter("all");
    setBranchFilterLabel("Todas las sucursales");
    setHasInitialFilter(true);
  }, [branchOptions, hasInitialFilter, isAdmin, userBranchId]);

  useEffect(() => {
    if (branchFilter === "all") {
      setBranchFilterLabel("Todas las sucursales");
      return;
    }

    if (branchFilter === "none") {
      setBranchFilterLabel("Sin sucursal");
      return;
    }

    const branchName =
      branchOptions.find((branch) => branch.id === branchFilter)?.name ||
      "Sucursal seleccionada";
    setBranchFilterLabel(branchName);
  }, [branchFilter, branchOptions]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          expense.name.toLowerCase().includes(searchLower) ||
          expense.description.toLowerCase().includes(searchLower) ||
          (expense.user?.fullName?.toLowerCase() ?? "").includes(searchLower) ||
          (expense.branch?.name?.toLowerCase() ?? "").includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (branchFilter !== "all") {
        if (branchFilter === "none") {
          if (expense.branchId) {
            return false;
          }
        } else if ((expense.branchId ?? "none") !== branchFilter) {
          return false;
        }
      } else if (!isAdmin && userBranchId) {
        if (expense.branchId !== userBranchId) {
          return false;
        }
      }

      if (startDate) {
        const expenseDate = new Date(expense.date);
        if (expenseDate < new Date(startDate)) {
          return false;
        }
      }

      if (endDate) {
        const expenseDate = new Date(expense.date);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (expenseDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [branchFilter, endDate, expenses, isAdmin, searchTerm, startDate, userBranchId]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleBranchChange = (branchId: string) => {
    setBranchFilter(branchId);
    setCurrentPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(1);
  };

  // Calcular gastos para la página actual
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <ExpensesStats expenses={expenses} isLoading={isLoading} />

      {/* Filtros */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <ExpensesFilters
            branches={branchOptions}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onBranchChange={handleBranchChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            selectedBranch={branchFilter}
            branchLabel={branchFilterLabel}
            startDate={startDate}
            endDate={endDate}
            showBranchFilter={isAdmin || branchOptions.length > 1}
          />
        </CardContent>
      </Card>

      {/* Tabla de gastos */}
      <div className="space-y-3">
        <div className="rounded-md border border-gray-200 bg-white dark:border-[#2a2a2a] dark:bg-[#1a1a1a] overflow-hidden">
          <ExpensesTable
            expenses={currentExpenses}
            isLoading={isLoading}
            onEditClick={onEdit}
            onDeleteClick={onDelete}
          />
        </div>
      </div>

      {/* Paginación */}
      <div className="flex justify-center">
        <ExpensesPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredExpenses.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
