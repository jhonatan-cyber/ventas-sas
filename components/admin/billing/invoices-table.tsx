"use client";

import {
  Eye,
  Mail,
  FileText,
  Download,
  Printer,
  Building2,
  DollarSign,
  Calendar,
  MessageCircle,
} from "lucide-react";

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
import {
  SerializedInvoiceWithRelations,
  InvoiceFilters,
} from "@/lib/services/admin/billing-service";
import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences";

interface InvoicesTableProps {
  invoices: SerializedInvoiceWithRelations[];
  loading: boolean;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onRefresh: () => void;
  onInvoiceClick?: (invoice: SerializedInvoiceWithRelations) => void;
  onPrintInvoice?: (invoice: SerializedInvoiceWithRelations) => void;
  onDownloadPDF?: (invoice: SerializedInvoiceWithRelations) => void;
  onSendCredentials?: (invoice: SerializedInvoiceWithRelations) => void;
  onSendWhatsApp?: (invoice: SerializedInvoiceWithRelations) => void;
}

export const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    refunded:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  const labels: Record<string, string> = {
    paid: "Pagada",
    pending: "Pendiente",
    overdue: "Vencida",
    cancelled: "Cancelada",
    refunded: "Reembolsada",
  };

  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
};

// Funciones de formateo que usan las preferencias del usuario
export const formatCurrency = (
  amount: number | string,
  currency: string = "USD"
) => {
  // Si se proporciona una moneda específica, usarla; de lo contrario, usar preferencias
  return formatCurrencyWithPreferences(amount, undefined, currency);
};

export const formatDate = (date: Date | string) => {
  return formatDateWithPreferences(date);
};

export function InvoicesTable({
  invoices,
  loading,
  onInvoiceClick,
  onPrintInvoice,
  onDownloadPDF,
  onSendCredentials,
  onSendWhatsApp,
}: InvoicesTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando facturas...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Número</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Cliente</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Organización</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Monto</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Estado
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Fecha Emisión</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">Fecha Vencimiento</div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay facturas registradas
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white font-mono">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {invoice.billingName}
                        </span>
                      </div>
                      {invoice.billingEmail && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {invoice.billingEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.organization ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.organization.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {(() => {
                          const amount = Number(invoice.total)
                          const currency = invoice.currency || 'BOB'
                          // Formatear número sin símbolo de moneda (solo número con separadores)
                          const formatted = new Intl.NumberFormat('es-BO', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(amount)
                          // Agregar símbolo de moneda al final según corresponda
                          if (currency === 'BOB') {
                            return `${formatted} Bs`
                          }
                          // Para otras monedas, solo el número formateado
                          return formatted
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDateWithPreferences(invoice.issueDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span
                        className={`text-sm ${
                          invoice.dueDate < new Date() &&
                          invoice.status !== "paid"
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {formatDateWithPreferences(invoice.dueDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onInvoiceClick && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onInvoiceClick(invoice)}
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalles</TooltipContent>
                        </Tooltip>
                      )}
                      {invoice.payments && invoice.payments.length > 0 && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDownloadPDF?.(invoice)}
                                  className="hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Descargar PDF</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPrintInvoice?.(invoice)}
                                  className="hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Imprimir</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSendCredentials?.(invoice)}
                                  className="hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Enviar credenciales por Email</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSendWhatsApp?.(invoice)}
                                  className="hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Enviar credenciales por WhatsApp</TooltipContent>
                          </Tooltip>
                        </>
                      )}
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
