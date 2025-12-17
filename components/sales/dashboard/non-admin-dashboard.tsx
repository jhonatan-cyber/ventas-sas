"use client"

import { 
  ShoppingCart, 
  FileText, 
  Clock,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  Award
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSasPermissions } from "@/contexts/sas-permissions-context"

interface NonAdminDashboardProps {
  customerSlug: string
  userName: string
  userRole: string
  userBranch?: string
  maxBranches?: number | null
}

interface UserStats {
  mySalesThisMonth: number
  myTotalSales: number
  myRevenueThisMonth: number
  myTotalRevenue: number
  myPendingQuotations: number
  myTotalQuotations: number
  recentSales: any[]
  recentQuotations: any[]
}

export function NonAdminDashboard({ 
  customerSlug, 
  userName, 
  userRole, 
  userBranch,
  maxBranches: _maxBranches 
}: NonAdminDashboardProps) {
  const { hasPermission } = useSasPermissions()
  const [stats, setStats] = useState<UserStats>({
    mySalesThisMonth: 0,
    myTotalSales: 0,
    myRevenueThisMonth: 0,
    myTotalRevenue: 0,
    myPendingQuotations: 0,
    myTotalQuotations: 0,
    recentSales: [],
    recentQuotations: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Cargar estadísticas del usuario
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/${customerSlug}/dashboard/user-stats`)
        
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          console.error('Error cargando estadísticas del usuario:', response.status, errorData)
          toast.error(`Error al cargar estadísticas: ${errorData.error || 'Error del servidor'}`)
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar las estadísticas')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserStats()
  }, [customerSlug])

  // Formatear moneda (función simple)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Determinar accesos rápidos basados en permisos
  const getQuickAccess = () => {
    const access = []
    
    if (hasPermission('ventas_listar')) {
      access.push({
        title: 'Mis Ventas',
        href: `/${customerSlug}/ventas`,
        icon: ShoppingCart,
        color: 'green',
        description: 'Ver mis ventas'
      })
    }
    
    if (hasPermission('cotizaciones_listar')) {
      access.push({
        title: 'Mis Cotizaciones',
        href: `/${customerSlug}/cotizaciones`,
        icon: FileText,
        color: 'blue',
        description: 'Gestionar cotizaciones'
      })
    }
    
    if (hasPermission('productos_listar')) {
      access.push({
        title: 'Productos',
        href: `/${customerSlug}/productos`,
        icon: ShoppingBag,
        color: 'purple',
        description: 'Ver catálogo'
      })
    }
    
    if (hasPermission('clientes_listar')) {
      access.push({
        title: 'Clientes',
        href: `/${customerSlug}/clientes`,
        icon: Users,
        color: 'orange',
        description: 'Gestionar clientes'
      })
    }

    return access
  }

  const quickAccess = getQuickAccess()

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Encabezado personalizado */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          Mi Dashboard
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          Bienvenido, {userName}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            {userRole}
          </span>
          {userBranch && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
              {userBranch}
            </span>
          )}
        </div>
      </div>

      {/* Estadísticas personales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mis Ventas del Mes
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2 break-words">
                  {stats.mySalesThisMonth}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.myTotalSales} ventas totales
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mis Ingresos del Mes
                </p>
                <p className="text-sm sm:text-base md:text-lg xl:text-xl font-bold text-orange-600 dark:text-orange-400 mt-1 sm:mt-2 break-words">
                  {formatCurrency(stats.myRevenueThisMonth)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatCurrency(stats.myTotalRevenue)} total
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-yellow-50/50 to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-900/10 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 xl:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones Pendientes
                </p>
                <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1 sm:mt-2 break-words">
                  {stats.myPendingQuotations}
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
                  {stats.myTotalQuotations}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mis cotizaciones
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 xl:h-6 xl:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos basados en permisos */}
      {quickAccess.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
          <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className={`grid gap-3 sm:gap-4 ${quickAccess.length <= 2 ? 'grid-cols-2' : quickAccess.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {quickAccess.map((item) => {
                const colorClasses = {
                  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400',
                  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }
                
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-lg border transition-all hover:scale-105 active:scale-95 ${colorClasses[item.color as keyof typeof colorClasses]}`}
                  >
                    <item.icon className="h-6 w-6 md:h-7 md:w-7 mb-2" />
                    <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white text-center">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                      {item.description}
                    </span>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actividad reciente */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Mis ventas recientes */}
        {hasPermission('ventas_listar') && (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
            <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Mis Ventas Recientes</CardTitle>
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {stats.recentSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No tienes ventas recientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {stats.recentSales.slice(0, 5).map((sale: any) => (
                    <div
                      key={sale.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate mb-1">
                          {sale.saleNumber}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                          {sale.customer?.name || 'Cliente'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(sale.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end self-end sm:self-auto">
                        <p className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
                          {formatCurrency(Number(sale.total))}
                        </p>
                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                          sale.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {sale.status === 'completed' ? 'Completada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mis cotizaciones pendientes */}
        {hasPermission('cotizaciones_listar') && (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
            <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Mis Cotizaciones Pendientes</CardTitle>
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {stats.myPendingQuotations === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No tienes cotizaciones pendientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {stats.recentQuotations
                    .filter((q: any) => q.status === 'pending')
                    .slice(0, 5)
                    .map((quotation: any) => (
                      <div
                        key={quotation.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate mb-1">
                            {quotation.quotationNumber}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                            {quotation.customer?.name || 'Cliente'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(quotation.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end self-end sm:self-auto">
                          <p className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
                            {formatCurrency(Number(quotation.total))}
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
        )}
      </div>

      {/* Mensaje motivacional */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                ¡Sigue así, {userName}!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.mySalesThisMonth > 0 
                  ? `Has realizado ${stats.mySalesThisMonth} venta${stats.mySalesThisMonth > 1 ? 's' : ''} este mes. ¡Excelente trabajo!`
                  : 'Es un buen momento para generar nuevas ventas. ¡Tú puedes!'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}