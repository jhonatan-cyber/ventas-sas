"use client";

import {
  Edit,
  Trash2,
  FileText,
  Eye,
  ShoppingCart,
  MoreVertical,
  Building2,
  CalendarDays,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"

import { SalesQuotationWithRelations } from "./types"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  formatDateWithPreferences,
  formatCurrencyWithPreferences,
} from "@/lib/utils/preferences";

interface QuotationsCardsProps {
  quotations: SalesQuotationWithRelations[];
  showBranchColumn?: boolean;
  customerSlug: string;
  onEdit?: (quotation: SalesQuotationWithRelations) => void;
  onDelete?: (quotation: SalesQuotationWithRelations) => void;
  onViewDetails?: (quotation: SalesQuotationWithRelations) => void;
  onConvert?: (quotation: SalesQuotationWithRelations) => void | Promise<void>;
  maxBranches?: number | null;
}

const statusTokens: Record<string, { label: string; className: string }> = {
  active: {
    label: "Activa",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Vencida",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  converted: {
    label: "Convertida",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Pendiente",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  },
  approved: {
    label: "Aprobada",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rechazada",
    className:
      "bg-gray-200 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
};

export function QuotationsCards({
  quotations,
  showBranchColumn = false,
  customerSlug,
  onEdit,
  onDelete,
  onViewDetails,
  onConvert,
  maxBranches,
}: QuotationsCardsProps) {const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (quotations.length === 0) {
    return null;
  }

  // Función helper para formatear moneda de forma segura
  const formatCurrency = (amount: number) => {
    if (!mounted) {
      // Durante SSR, usar formato simple sin preferencias (fallback)
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: 2,
      }).format(amount);
    }
    return formatCurrencyWithPreferences(amount, customerSlug);
  };

  // Función helper para formatear fecha de forma segura
  const formatDateSafe = (date: Date | string) => {
    if (!mounted) {
      // Durante SSR, usar formato simple
      const d = new Date(date);
      return d.toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return formatDateWithPreferences(date);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {quotations.map((quotation) => {
        const totalItems = quotation.items?.length || 0;
        const totalQuantity =
          quotation.items?.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
          ) || 0;
        const token = statusTokens[quotation.status] || statusTokens.pending;
        const rawFullName = `${quotation.customer?.name ?? ""} ${
          quotation.customer?.lastName ?? ""
        }`.trim();
        const customerDisplayName =
          rawFullName || quotation.customerName || "Cliente sin registrar";
        const branchName = quotation.branch?.name || "Sin sucursal";
        const customerEmail = quotation.customer?.email || null;
        const hasMissingProductIds = quotation.items?.some(
          (item) => !item.productId
        );
        const isConverted = quotation.status === "converted";
        const canConvert = !isConverted && !hasMissingProductIds;

        return (
          <Card
            key={quotation.id}
            className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header con número de cotización, estado y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {quotation.quotationNumber}
                      </span>
                      <Badge
                        className={`${token.className} rounded-full px-2 py-0.5 text-xs font-semibold shrink-0`}
                      >
                        {token.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                        {formatCurrency(Number(quotation.total))}
                      </span>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onViewDetails && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onViewDetails(quotation)}
                            className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
                          >
                            <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400">
                              Ver detalles
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onConvert && canConvert && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onConvert(quotation)}
                            className="cursor-pointer text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Convertir
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onEdit && !isConverted && (
                        <DropdownMenuItem
                          onClick={() => onEdit(quotation)}
                          className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400"
                        >
                          <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-yellow-600 dark:text-yellow-400">
                            Editar
                          </span>
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(quotation)}
                            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                            <span className="text-red-600 dark:text-red-400">
                              Eliminar
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información detallada */}
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      {customerDisplayName}
                    </span>
                  </div>
                  {customerEmail && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-5">
                        {customerEmail}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {totalItems} productos · {totalQuantity} unidades
                    </span>
                  </div>
                  {showBranchColumn && maxBranches !== 1 && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 text-xs px-2 py-0"
                      >
                        {branchName}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      Emitida: {formatDateSafe(quotation.createdAt)}
                    </span>
                  </div>
                  {quotation.expiresAt && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Vence: {formatDateSafe(quotation.expiresAt)}
                      </span>
                    </div>
                  )}
                  {Number(quotation.discount) > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                        Descuento: {formatCurrency(Number(quotation.discount))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
