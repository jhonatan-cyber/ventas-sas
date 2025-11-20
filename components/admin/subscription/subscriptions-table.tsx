"use client";

import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Calendar,
  Building2,
  User,
  Eye,
} from "lucide-react";

import type { SubscriptionWithDetails } from "./types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHasPermission } from "@/hooks/admin/use-user-permissions";


interface SubscriptionsTableProps {
  subscriptions: SubscriptionWithDetails[];
  onEdit?: (subscription: SubscriptionWithDetails) => void;
  onViewDetails?: (subscription: SubscriptionWithDetails) => void;
  onToggleStatus?: (subscriptionId: string, currentStatus: string) => void;
  onDelete?: (subscriptionId: string, organizationName: string) => void;
}

export function SubscriptionsTable({
  subscriptions,
  onEdit,
  onViewDetails,
  onToggleStatus,
  onDelete,
}: SubscriptionsTableProps) {
  const canEdit = useHasPermission("suscripciones_editar");
  const canViewDetails = useHasPermission("suscripciones_listar");
  const canDelete = useHasPermission("suscripciones_eliminar");
  const canActivate = useHasPermission("suscripciones_activar");
  const canDeactivate = useHasPermission("suscripciones_desactivar");

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    // Si es string, parsearlo primero
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Obtener año, mes y día directamente sin conversión de zona horaria
    // Usar UTC para evitar problemas de zona horaria
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "expired":
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
      case "trial":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "cancelled":
        return "Cancelada";
      case "expired":
        return "Expirada";
      case "trial":
        return "Prueba";
      default:
        return status;
    }
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Empresa</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Cliente</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Plan</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Estado</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Período</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Vigencia</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay suscripciones registradas
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow
                  key={subscription.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage 
                          src={subscription.organization?.whiteLabelBranding?.logoUrl || undefined} 
                          alt={subscription.organization?.razonSocial || subscription.organization?.name || "Empresa"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                          {(subscription.organization?.razonSocial || subscription.organization?.name || "E").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {subscription.organization?.razonSocial ||
                              subscription.organization?.name ||
                              "Sin empresa"}
                          </span>
                        </div>
                        {subscription.organization?.nit && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              NIT: {subscription.organization.nit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {`${subscription.customer?.nombre || ""} ${
                                subscription.customer?.apellido || ""
                              }`.trim() ||
                              subscription.customer?.email ||
                              "Sin cliente"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {subscription.customer?.email || "Sin email"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      >
                        {subscription.plan.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(subscription.status)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {subscription.billingPeriod === "monthly"
                          ? "Mensual"
                          : "Anual"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 py-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(subscription.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(subscription.endDate)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => onViewDetails?.(subscription)}
                              disabled={!canViewDetails}
                            >
                              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canViewDetails
                            ? "Ver detalles"
                            : "No tiene permiso para ver detalles"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => onEdit?.(subscription)}
                              disabled={!canEdit}
                            >
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canEdit
                            ? "Editar suscripción"
                            : "No tiene permiso para editar suscripciones"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${
                                subscription.status === "active"
                                  ? "hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                  : "hover:bg-green-50 dark:hover:bg-green-900/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              onClick={() =>
                                onToggleStatus?.(
                                  subscription.id,
                                  subscription.status
                                )
                              }
                              disabled={
                                (subscription.status === "active" &&
                                  !canDeactivate) ||
                                (subscription.status !== "active" &&
                                  !canActivate)
                              }
                            >
                              {subscription.status === "active" ? (
                                <PowerOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {subscription.status === "active"
                            ? canDeactivate
                              ? "Cancelar suscripción"
                              : "No tiene permiso para cancelar suscripciones"
                            : canActivate
                            ? "Activar suscripción"
                            : "No tiene permiso para activar suscripciones"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() =>
                                onDelete?.(
                                  subscription.id,
                                  subscription.organization?.razonSocial ||
                                    subscription.organization?.name ||
                                    `${subscription.customer?.nombre || ""} ${
                                      subscription.customer?.apellido || ""
                                    }`.trim() ||
                                    subscription.customer?.email ||
                                    "Sin empresa"
                                )
                              }
                              disabled={!canDelete}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canDelete
                            ? "Eliminar suscripción"
                            : "No tiene permiso para eliminar suscripciones"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
