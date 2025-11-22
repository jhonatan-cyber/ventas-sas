"use client"


import { ShoppingCart, TrendingDown, Package, Users, DollarSign, Receipt, BarChart3, TrendingUp, Sparkles, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  bgGradient: string
  iconBg: string
  route: string
  type: 'basic' | 'advanced'
}

// Función para obtener reportes básicos (para empresas con una sola sucursal)
const getBasicReports = (t: any): ReportCard[] => [
  {
    id: 'general',
    title: t('reports.reports.general.title'),
    description: t('reports.reports.general.description'),
    icon: DollarSign,
    bgGradient: 'from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10',
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
    route: 'general',
    type: 'basic'
  },
  {
    id: 'sales',
    title: t('reports.reports.sales.title'),
    description: t('reports.reports.sales.description'),
    icon: ShoppingCart,
    bgGradient: 'from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    route: 'sales',
    type: 'basic'
  },
  {
    id: 'products',
    title: t('reports.reports.products.title'),
    description: t('reports.reports.products.description'),
    icon: Package,
    bgGradient: 'from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    route: 'products',
    type: 'basic'
  },
  {
    id: 'expenses',
    title: t('reports.reports.expenses.title'),
    description: t('reports.reports.expenses.description'),
    icon: TrendingDown,
    bgGradient: 'from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
    route: 'expenses',
    type: 'basic'
  },
]

// Función para obtener reportes avanzados (para empresas con múltiples sucursales)
const getAdvancedReports = (t: any): ReportCard[] => [
  // Helper para usar traducciones con fallback seguro (evita que MISSING_MESSAGE rompa la UI)
  (() => {
    let title = 'Reporte de Sucursales'
    let description = 'Desempeño de ventas e ingresos por sucursal'
    try {
      title = t('reports.reports.branches.title')
      description = t('reports.reports.branches.description')
    } catch {
      // Si hay problema con las traducciones, usamos texto por defecto
    }
    return {
      id: 'branches',
      title,
      description,
      icon: Building2,
      bgGradient: 'from-sky-50/50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10',
      iconBg: 'bg-gradient-to-br from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700',
      route: 'branches',
      type: 'advanced' as const
    }
  })(),
  {
    id: 'customers',
    title: t('reports.reports.customers.title'),
    description: t('reports.reports.customers.description'),
    icon: Users,
    bgGradient: 'from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
    route: 'customers',
    type: 'advanced'
  },
  {
    id: 'cash-registers',
    title: t('reports.reports.cashRegisters.title'),
    description: t('reports.reports.cashRegisters.description'),
    icon: Receipt,
    bgGradient: 'from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700',
    route: 'cash-registers',
    type: 'advanced'
  },
  {
    id: 'ai-advanced',
    title: t('reports.reports.aiAdvanced.title'),
    description: t('reports.reports.aiAdvanced.description'),
    icon: Sparkles,
    bgGradient: 'from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-700',
    route: 'inteligencia',
    type: 'advanced'
  }
]

interface ReportsContainerProps {
  customerSlug: string
  maxBranches?: number | null
}

export function ReportsContainer({ customerSlug, maxBranches }: ReportsContainerProps) {
  const t = useTranslations()
  const router = useRouter()

  // Determinar si mostrar reportes avanzados (más de una sucursal permitida)
  const isAdvanced = (maxBranches ?? 1) > 1
  const basicReports = getBasicReports(t)
  const advancedReports = getAdvancedReports(t)

  const renderReportCard = (report: ReportCard) => {
    const Icon = report.icon
    return (
      <Card
        key={report.id}
        className={`relative overflow-hidden border border-gray-200/60 dark:border-gray-800/60
          bg-gradient-to-br ${report.bgGradient} backdrop-blur-sm
          hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20
          transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
          group min-h-[140px] sm:min-h-[160px]`}
        onClick={() => router.push(`/${customerSlug}/reportes/${report.route}`)}
      >
        <CardContent className="relative p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-opacity-90 transition-colors leading-tight">
                  {report.title}
                </h3>
                {report.type === 'advanced' && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 w-fit">
                    {t('reports.advancedLabel')}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {report.description}
              </p>
            </div>
            <div className={`${report.iconBg} w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.3} />
            </div>
          </div>
          <div className="pt-2 sm:pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('reports.viewFullReport')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Reportes Básicos */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
            <span className="whitespace-nowrap">{t('reports.basic')}</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
        </div>
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {basicReports.map(renderReportCard)}
        </div>
      </div>

      {/* Reportes Avanzados - Solo si tiene más de una sucursal */}
      {isAdvanced && (
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              <span className="whitespace-nowrap">{t('reports.advanced')}</span>
              <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 whitespace-nowrap">
                {t('reports.advancedBadge')}
              </Badge>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          </div>
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2">
            {advancedReports.map(renderReportCard)}
          </div>
        </div>
      )}
    </div>
  )
}

