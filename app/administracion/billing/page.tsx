import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { BillingPageClient } from "@/components/admin/billing/billing-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { BillingService, SerializedBillingStats, SerializedInvoiceWithRelations } from "@/lib/services/admin/billing-service"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function BillingPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value

  if (!token) {
    redirect('/administracion/login')
  }

  try {
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      redirect('/administracion/login')
    }

    // Validar acceso de administrador
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      redirect('/administracion/login?error=no_access')
    }

    // Verificar permiso específico para listar facturas
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'facturas_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener datos iniciales
    const [initialInvoices, initialStats] = await Promise.all([
      BillingService.getInvoices({}, 0, 1000),
      BillingService.getBillingStats(),
    ])

    // Convertir valores Decimal a números para pasar al componente cliente
    const serializedStats: SerializedBillingStats = {
      totalRevenue: Number(initialStats.totalRevenue),
      pendingAmount: Number(initialStats.pendingAmount),
      overdueAmount: Number(initialStats.overdueAmount),
      totalInvoices: initialStats.totalInvoices,
      paidInvoices: initialStats.paidInvoices,
      pendingInvoices: initialStats.pendingInvoices,
      overdueInvoices: initialStats.overdueInvoices,
      revenueByMonth: initialStats.revenueByMonth.map(item => ({
        month: item.month,
        revenue: Number(item.revenue),
      })),
      revenueByGateway: initialStats.revenueByGateway.map(item => ({
        gateway: item.gateway,
        revenue: Number(item.revenue),
      })),
    }

    // Serializar facturas: convertir Decimal a números
    const serializedInvoices: SerializedInvoiceWithRelations[] = initialInvoices.invoices.map(invoice => ({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      payments: invoice.payments?.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount),
      })) || [],
    }))

    return <BillingPageClient initialInvoices={serializedInvoices} initialStats={serializedStats} />
  } catch (error) {
    console.error('Error en BillingPage:', error)
    redirect('/administracion/login')
  }
}
