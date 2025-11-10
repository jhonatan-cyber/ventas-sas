"use client"

import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle, Gauge, XCircle } from "lucide-react"

interface HealthWidgetProps {
  data: {
    uptime: number
    averageLatency: number
    errorRate: number
    lastCheck: string
  }
}

export function HealthWidget({ data }: HealthWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.uptime.toFixed(2)}%
            </p>
          </div>
          <CheckCircle
            className={`h-6 w-6 ${
              data.uptime >= 99.9
                ? "text-green-500"
                : data.uptime >= 99
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Latencia</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.averageLatency.toFixed(0)}ms
            </p>
          </div>
          <Gauge
            className={`h-6 w-6 ${
              data.averageLatency < 200
                ? "text-green-500"
                : data.averageLatency < 500
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Errores</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.errorRate.toFixed(2)}%
            </p>
          </div>
          <XCircle
            className={`h-6 w-6 ${
              data.errorRate < 1
                ? "text-green-500"
                : data.errorRate < 5
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Última verificación:{" "}
        {formatDistanceToNow(new Date(data.lastCheck), {
          addSuffix: true,
          locale: es,
        })}
      </p>
    </div>
  )
}
