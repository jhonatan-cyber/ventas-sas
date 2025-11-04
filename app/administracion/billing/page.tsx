import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { BillingService } from "@/lib/services/admin/billing-service"
import { AuthService } from "@/lib/services/auth-service"
import { BillingPageClient } from "@/components/admin/billing/billing-page-client"

export default async function BillingPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  if (!token) {
    redirect('/administracion/login')
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect('/administracion/login')
  }

  // Validar super admin
  const profile = await AuthService.getProfileById(payload.userId)
  if (!profile || !profile.isSuperAdmin) {
    redirect('/administracion/login')
  }

  // Obtener datos iniciales
  const [initialInvoices, initialStats] = await Promise.all([
    BillingService.getInvoices({}, 0, 50),
    BillingService.getBillingStats(),
  ])

  // Convertir valores Decimal a números para pasar al componente cliente
  const serializedStats = {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Facturación y Pagos
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona facturas, pagos y métodos de pago del sistema
          </p>
        </div>

        <BillingPageClient
          initialInvoices={initialInvoices.invoices}
          initialTotal={initialInvoices.total}
          initialStats={serializedStats}
        />
      </div>
    </AdminLayout>
  )
}
