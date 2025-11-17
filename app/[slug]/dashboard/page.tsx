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
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AnalyticsDashboardClient } from "@/components/analytics/analytics-dashboard-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuotationService } from "@/lib/services/sales/quotation-service"
import { SalesDashboardService } from "@/lib/services/sales/sales-dashboard-service"
import { formatDate } from "@/lib/utils/date"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug, getMaxBranchesBySlug } from "@/lib/utils/organization"
import { FormattedDate } from "@/components/dashboard/dashboard-formatters"
import { formatCurrencyWithPreferencesFromServer } from "@/lib/utils/preferences"



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
  const sessionCookie = cookieStore.get("sas-session")
  
  if (!sessionCookie) {
    redirect(`/${slug}/login`)
  }

  let session: any = null
  try {
    const value = sessionCookie.value
    let decoded: string
    try {
      decoded = Buffer.from(value, 'base64').toString('utf8')
      session = JSON.parse(decoded)
    } catch  {
      session = JSON.parse(value)
    }
  } catch  {
    redirect(`/${slug}/login`)
  }

  // Verificar que la sesión corresponde a la organización correcta
  if (session.organizationSlug !== slug) {
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  
  // Obtener el límite de sucursales para determinar el tipo de widgets
  const maxBranches = await getMaxBranchesBySlug(slug)

  const fullName = session.fullName || customer.primaryOrganization?.razonSocial || customer.primaryOrganization?.name || "Usuario"

  // Obtener estadísticas (si no hay organización, usar valores por defecto)
  const [stats, recentQuotations] = organizationId
    ? await Promise.all([
        SalesDashboardService.getDashboardStats(organizationId),
        QuotationService.getAllQuotations(organizationId, 0, 5, undefined, 'pending')
      ])
    : [
        { salesThisMonth: 0, totalSales: 0, totalCustomers: 0, totalProducts: 0, revenueThisMonth: 0, totalRevenue: 0 },
        { quotations: [], total: 0 }
      ] as any

  const pendingQuotations = recentQuotations.quotations.filter((q: any) => q.status === 'pending').length

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Encabezado */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          Bienvenido, {fullName}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas del Mes
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2 break-words">
                  {stats.salesThisMonth}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.totalSales} ventas totales
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clientes
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {stats.totalCustomers}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clientes activos
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productos
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 break-words">
                  {stats.totalProducts}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Productos activos
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ingresos del Mes
                </p>
                <p className="text-sm sm:text-base md:text-lg xl:text-xl font-bold text-orange-600 dark:text-orange-400 mt-1 sm:mt-2 break-words">
                  {formatCurrencyWithPreferencesFromServer(stats.revenueThisMonth, cookieStore, slug)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatCurrencyWithPreferencesFromServer(stats.totalRevenue, cookieStore, slug)} total
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas secundarias */}
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${maxBranches && maxBranches > 1 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-yellow-50/50 to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones Pendientes
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1 sm:mt-2 break-words">
                  {pendingQuotations}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Requieren atención
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cotizaciones
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 break-words">
                  {recentQuotations.total}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Todas las cotizaciones
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {maxBranches && maxBranches > 1 && (
          <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sucursales
                  </p>
                  <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2 break-words">
                    -
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sucursales activas
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analytics y Gráficos */}
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Analytics y Métricas
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Visualización de datos y tendencias de tu negocio
          </p>
        </div>
        <AnalyticsDashboardClient slug={slug} maxBranches={maxBranches} />
      </div>

      {/* Contenido secundario */}
      <div className="hidden md:grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Cotizaciones recientes */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
          <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Cotizaciones Pendientes</CardTitle>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            {pendingQuotations === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay cotizaciones pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {recentQuotations.quotations
                  .filter((q: any) => q.status === 'pending')
                  .slice(0, 5)
                  .map((quotation: any) => (
                    <div
                      key={quotation.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate mb-1">
                          {quotation.quotationNumber}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                          {quotation.customer?.name || 'Cliente'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          <FormattedDate date={quotation.createdAt} slug={slug} />
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end self-end sm:self-auto">
                        <p className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
                          <FormattedCurrency value={Number(quotation.total)} slug={slug} />
                        </p>
                        <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
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
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
          <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <a
                href={`/${slug}/ventas`}
                className="flex flex-col items-center justify-center p-4 md:p-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Ventas</span>
              </a>
              <a
                href={`/${slug}/cotizaciones`}
                className="flex flex-col items-center justify-center p-4 md:p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <FileText className="h-6 w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Cotizaciones</span>
              </a>
              <a
                href={`/${slug}/productos`}
                className="flex flex-col items-center justify-center p-4 md:p-5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingBag className="h-6 w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Productos</span>
              </a>
              <a
                href={`/${slug}/clientes`}
                className="flex flex-col items-center justify-center p-4 md:p-5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <Users className="h-6 w-6 md:h-7 md:w-7 text-orange-600 dark:text-orange-400 mb-2" />
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Clientes</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
