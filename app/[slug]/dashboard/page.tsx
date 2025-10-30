import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesDashboardService } from "@/lib/services/sales/sales-dashboard-service"
import { QuotationService } from "@/lib/services/sales/quotation-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"
import { 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  FileText,
  ShoppingBag,
  Building2,
  Clock,
  CheckCircle2
} from "lucide-react"
import { formatDate } from "@/lib/utils/date"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/login`)
  }

  // Verificar sesión
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("sales_session")
  
  if (!sessionCookie) {
    redirect(`/${slug}/login`)
  }

  let session: any = null
  try {
    session = JSON.parse(sessionCookie.value)
  } catch (e) {
    redirect(`/${slug}/login`)
  }

  // Verificar que la sesión corresponde al cliente correcto
  if (session.customerSlug !== slug) {
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/login`)
  }

  const fullName = session.fullName || customer.razonSocial || "Usuario"

  // Obtener estadísticas
  const [stats, recentQuotations] = await Promise.all([
    SalesDashboardService.getDashboardStats(organizationId),
    QuotationService.getAllQuotations(organizationId, 0, 5, undefined, 'pending')
  ])

  const pendingQuotations = recentQuotations.quotations.filter(q => q.status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenido, {fullName}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Ventas del Mes</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.salesThisMonth}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stats.totalSales} ventas totales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Clientes</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Clientes activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Productos</CardTitle>
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Productos activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Ingresos del Mes</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${stats.revenueThisMonth.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ${stats.totalRevenue.toLocaleString('es-BO', { minimumFractionDigits: 2 })} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas secundarias */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuotations}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentQuotations.total}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Todas las cotizaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucursales</CardTitle>
            <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sucursales activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido secundario */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cotizaciones recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cotizaciones Pendientes</CardTitle>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {pendingQuotations === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay cotizaciones pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuotations.quotations
                  .filter(q => q.status === 'pending')
                  .slice(0, 5)
                  .map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a]"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {quotation.quotationNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {quotation.customer?.name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(quotation.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          ${Number(quotation.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pendiente
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`/${slug}/ventas`}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Ventas</span>
              </a>
              <a
                href={`/${slug}/cotizaciones`}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Cotizaciones</span>
              </a>
              <a
                href={`/${slug}/productos`}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Productos</span>
              </a>
              <a
                href={`/${slug}/clientes`}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Clientes</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
