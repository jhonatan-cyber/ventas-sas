"use client";

import { useTranslations } from "next-intl";

import { DollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ExpensesCards } from "./expenses-cards";
import { ExpensesFilters } from "./expenses-filters";
import { ExpensesPagination } from "./expenses-pagination";
import { ExpensesStats } from "./expenses-stats";
import { ExpensesTable } from "./expenses-table";
import { ExpenseBranchSummary, SalesExpenseWithRelations } from "./types";

import { Card, CardContent } from "@/components/ui/card";
import { getTranslatableText } from "@/lib/utils/translatable-text";

interface ExpensesContainerProps {
  expenses: SalesExpenseWithRelations[];
  branches: ExpenseBranchSummary[];
  isLoading?: boolean;
  isAdmin: boolean;
  userBranchId?: string | null;
  maxBranches?: number | null;
  onEdit?: (expense: SalesExpenseWithRelations) => void;
  onDelete?: (expense: SalesExpenseWithRelations) => void;
  onView?: (expense: SalesExpenseWithRelations) => void;
  customerSlug: string;
}

export function ExpensesContainer({
  expenses,
  branches,
  isLoading = false,
  isAdmin,
  userBranchId = null,
  maxBranches,
  onEdit,
  onDelete,
  onView,
  customerSlug,
}: ExpensesContainerProps) {
  const t = useTranslations()
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
      setBranchFilterLabel(t('common.noBranch'));
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
        // Obtener descripción traducida para búsqueda
        const currentLanguage = (() => {
          try {
            const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
            return prefs?.language || 'es';
          } catch {
            return 'es';
          }
        })();
        const description = getTranslatableText(
          expense.description,
          (expense as any).descriptionTranslations,
          currentLanguage
        ) || expense.description;
        const matchesSearch =
          expense.name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
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
            showBranchFilter={isAdmin && !(maxBranches === 1 && branchOptions.length === 1) && branchOptions.length > 1}
            customerSlug={customerSlug}
          />
        </CardContent>
      </Card>

      {/* Mostrar cards y tabla solo si hay gastos */}
      {currentExpenses.length > 0 ? (
        <>
          {/* Cards de gastos (solo móvil) */}
          <ExpensesCards
            expenses={currentExpenses}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />

          {/* Tabla de gastos (solo desktop) */}
          <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
            <ExpensesTable
              expenses={currentExpenses}
              isLoading={isLoading}
              branches={branchOptions}
              maxBranches={maxBranches}
              onEditClick={onEdit}
              onDeleteClick={onDelete}
              onViewClick={onView}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No hay gastos registrados</p>
          </div>
        </div>
      )}

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
