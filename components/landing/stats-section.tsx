"use client"

import { Building2, Package, TrendingUp, Users } from "lucide-react"

interface StatsSectionProps {
  stats: {
    organizations: number
    customers: number
    monthlySales: number
    products: number
  }
}

export function StatsSection({ stats }: StatsSectionProps) {
  const statsData = [
    { label: "Empresas activas", value: `${stats.organizations.toLocaleString('en-US')}+`, icon: Building2 },
    { label: "Transacciones/mes", value: `${stats.monthlySales.toLocaleString('en-US')}+`, icon: TrendingUp },
    { label: "Clientes registrados", value: `${stats.customers.toLocaleString('en-US')}+`, icon: Users },
    { label: "Productos gestionados", value: `${stats.products.toLocaleString('en-US')}+`, icon: Package }
  ]

  return (
    <section className="py-20 border-y bg-gradient-to-r from-blue-50/70 via-emerald-50/70 to-blue-50/70 dark:from-blue-950/30 dark:via-emerald-950/30 dark:to-blue-950/30">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {statsData.map((stat, i) => (
            <div
              key={i}
              className="text-center group cursor-default animate-in fade-in slide-in-from-bottom-8 duration-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
