"use client"

import { Activity, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ActivityWidgetProps {
  data: Array<{
    id: string
    type: string
    description: string
    createdAt: string
  }>
}

export function ActivityWidget({ data }: ActivityWidgetProps) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {data.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
          No hay actividad reciente
        </p>
      ) : (
        data.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg"
          >
            <Activity className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                {item.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
            {item.type && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {item.type}
              </Badge>
            )}
          </div>
        ))
      )}
    </div>
  )
}
