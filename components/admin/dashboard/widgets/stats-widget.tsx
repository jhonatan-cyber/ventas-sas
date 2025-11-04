"use client"

import { Users, Zap, CheckCircle, DollarSign } from "lucide-react"

interface StatsWidgetProps {
  data: {
    organizations: {
      total: number
      active: number
      suspended: number
    }
    users: {
      total: number
    }
    revenue: {
      total: number
    }
  }
}

export function StatsWidget({ data }: StatsWidgetProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
        <Zap className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-2" />
        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {data.organizations.total}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Organizaciones
        </p>
      </div>
      <div className="text-center p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
        <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {data.organizations.active}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Activas</p>
      </div>
      <div className="text-center p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
        <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-2" />
        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {data.users.total}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Usuarios</p>
      </div>
      <div className="text-center p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
        <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
        <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
          ${data.revenue.total.toLocaleString()}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ingresos</p>
      </div>
    </div>
  )
}
