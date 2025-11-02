"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, TrendingDown, Package, Users, DollarSign, Receipt } from "lucide-react"
import { useRouter } from "next/navigation"

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  bgGradient: string
  iconBg: string
  route: string
}

const reportCards: ReportCard[] = [
  {
    id: 'sales',
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas, ingresos y tendencias',
    icon: ShoppingCart,
    bgGradient: 'from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    route: 'sales'
  },
  {
    id: 'expenses',
    title: 'Reporte de Gastos',
    description: 'Desglose de gastos por categoría y período',
    icon: TrendingDown,
    bgGradient: 'from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
    route: 'expenses'
  },
  {
    id: 'general',
    title: 'Reporte General',
    description: 'Vista general de ingresos, egresos y utilidades',
    icon: DollarSign,
    bgGradient: 'from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10',
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
    route: 'general'
  },
  {
    id: 'products',
    title: 'Reporte de Productos',
    description: 'Productos más vendidos y estado de inventario',
    icon: Package,
    bgGradient: 'from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    route: 'products'
  },
  {
    id: 'customers',
    title: 'Reporte de Clientes',
    description: 'Clientes principales y comportamiento de compra',
    icon: Users,
    bgGradient: 'from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
    route: 'customers'
  },
  {
    id: 'cash-registers',
    title: 'Reporte de Cajas',
    description: 'Estado de cajas registradoras y movimientos',
    icon: Receipt,
    bgGradient: 'from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700',
    route: 'cash-registers'
  },
]

interface ReportsContainerProps {
  customerSlug: string
}

export function ReportsContainer({ customerSlug }: ReportsContainerProps) {
  const router = useRouter()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reportCards.map((report) => {
        const Icon = report.icon

        return (
          <Card
            key={report.id}
            className={`relative overflow-hidden border border-gray-200/60 dark:border-gray-800/60
              bg-gradient-to-br ${report.bgGradient} backdrop-blur-sm
              hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20
              transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
              group`}
            onClick={() => router.push(`/${customerSlug}/reportes/${report.route}`)}
          >
            <CardContent className="relative p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-opacity-90 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {report.description}
                  </p>
                </div>
                <div className={`${report.iconBg} w-12 h-12 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.3} />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Ver reporte completo →
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

