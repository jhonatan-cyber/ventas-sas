"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, FileText, Clock, AlertCircle, TrendingUp, RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import { InvoiceWithRelations, BillingStats, InvoiceFilters } from "@/lib/services/admin/billing-service"
import { InvoicesTable } from "./invoices-table"
import { PaymentMethods } from "./payment-methods"
import { InvoiceFormDialog } from "./invoice-form-dialog"
import { InvoiceDetailDialog } from "./invoice-detail-dialog"
import { PaymentFormDialog } from "./payment-form-dialog"

interface BillingPageClientProps {
  initialInvoices: InvoiceWithRelations[]
  initialTotal: number
  initialStats: BillingStats
}

export function BillingPageClient({
  initialInvoices,
  initialTotal,
  initialStats,
}: BillingPageClientProps) {
  const [activeTab, setActiveTab] = useState("invoices")
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>(initialInvoices)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<BillingStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null)

  // Cargar facturas
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("pageSize", "50")
      params.set("includeStats", "true")

      if (filters.organizationId) params.set("organizationId", filters.organizationId)
      if (filters.subscriptionId) params.set("subscriptionId", filters.subscriptionId)
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          params.set("status", filters.status.join(","))
        } else {
          params.set("status", filters.status)
        }
      }
      if (filters.startDate) params.set("startDate", filters.startDate.toISOString())
      if (filters.endDate) params.set("endDate", filters.endDate.toISOString())
      if (filters.search) params.set("search", filters.search)

      const response = await fetch(`/api/administracion/billing?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.invoices)
        setTotal(data.pagination.total)
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast.error("Error al cargar facturas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  // Formatear moneda
  const formatCurrency = (amount: number | string, currency: string = "USD") => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(numAmount)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="invoices">
          <FileText className="h-4 w-4 mr-2" />
          Facturas
        </TabsTrigger>
        <TabsTrigger value="payment-methods">
          <DollarSign className="h-4 w-4 mr-2" />
          Métodos de Pago
        </TabsTrigger>
      </TabsList>

      {/* Tab Facturas */}
      <TabsContent value="invoices" className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.totalRevenue.toString())}
              </div>
              <p className="text-xs text-gray-500 mt-1">Facturas pagadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(stats.pendingAmount.toString())}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingInvoices} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stats.overdueAmount.toString())}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.overdueInvoices} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Facturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.paidInvoices} pagadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Facturas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Facturas</CardTitle>
                <CardDescription>
                  {total} factura{total !== 1 ? "s" : ""} en total
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                <Button size="sm" onClick={() => setIsInvoiceFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Factura
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <InvoicesTable
              invoices={invoices}
              loading={loading}
              onFiltersChange={setFilters}
              onRefresh={fetchInvoices}
              onInvoiceClick={(invoice) => {
                setSelectedInvoice(invoice)
                setIsInvoiceDetailOpen(true)
              }}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Métodos de Pago */}
      <TabsContent value="payment-methods" className="space-y-6">
        <PaymentMethods />
      </TabsContent>

      {/* Diálogos */}
      <InvoiceFormDialog
        open={isInvoiceFormOpen}
        onOpenChange={setIsInvoiceFormOpen}
        onSave={() => {
          fetchInvoices()
        }}
      />

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={isInvoiceDetailOpen}
        onOpenChange={(open) => {
          setIsInvoiceDetailOpen(open)
          if (!open) {
            setSelectedInvoice(null)
          }
        }}
        onAddPayment={() => {
          setIsInvoiceDetailOpen(false)
          setIsPaymentFormOpen(true)
        }}
      />

      <PaymentFormDialog
        invoice={selectedInvoice}
        open={isPaymentFormOpen}
        onOpenChange={(open) => {
          setIsPaymentFormOpen(open)
          if (!open) {
            setIsInvoiceDetailOpen(true) // Volver al diálogo de detalles
          }
        }}
        onSave={() => {
          fetchInvoices()
          if (selectedInvoice) {
            // Recargar los detalles de la factura
            fetch(`/api/administracion/billing/${selectedInvoice.id}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success || data.invoice) {
                  setSelectedInvoice(data.invoice || data)
                }
              })
          }
        }}
      />
    </Tabs>
  )
}
