"use client"

import { FileText, Eye, Download, Printer, Mail, MoreVertical, DollarSign, Calendar, Building2 } from "lucide-react"

import { formatDate, formatCurrency, getStatusBadge } from "./invoices-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service"


interface InvoicesCardsProps {
  invoices: SerializedInvoiceWithRelations[]
  onView?: (invoice: SerializedInvoiceWithRelations) => void
  onDownloadPDF?: (invoice: SerializedInvoiceWithRelations) => void
  onPrintInvoice?: (invoice: SerializedInvoiceWithRelations) => void
}

export function InvoicesCards({ invoices, onView, onDownloadPDF, onPrintInvoice }: InvoicesCardsProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">No hay facturas registradas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Header con número, estado y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <FileText className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white text-xs">
                      #{invoice.invoiceNumber}
                    </span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  {invoice.billingName && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {invoice.billingName}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Menú de acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onView?.(invoice)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                      <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                    </DropdownMenuItem>
                    {invoice.payments && invoice.payments.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDownloadPDF?.(invoice)} className="cursor-pointer">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrintInvoice?.(invoice)} className="cursor-pointer">
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar por Email
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Información adicional */}
              <div className="space-y-2 text-[10px] text-gray-600 dark:text-gray-400">
                {invoice.billingEmail && (
                  <div className="flex items-center gap-1">
                    <span className="truncate">{invoice.billingEmail}</span>
                  </div>
                )}
                {invoice.organization && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{invoice.organization.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Emisión: {formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className={invoice.dueDate < new Date() && invoice.status !== 'paid' ? 'text-red-600 dark:text-red-400' : ''}>
                    Vencimiento: {formatDate(invoice.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

