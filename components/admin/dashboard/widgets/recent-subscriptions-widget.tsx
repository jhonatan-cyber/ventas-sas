"use client"

import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CreditCard } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface RecentSubscriptionsWidgetProps {
  data: Array<{
    id: string
    organization: {
      name: string
    } | null
    plan: {
      name: string
    } | null
    status: string
    updatedAt: string
  }>
}

export function RecentSubscriptionsWidget({
  data,
}: RecentSubscriptionsWidgetProps) {
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
          No hay suscripciones recientes
        </p>
      ) : (
                data
          .filter((sub) => sub.organization !== null)
          .slice(0, 3)
          .map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg"                                                           
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />    
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">                                                                      
                    {sub.organization?.name || 'Organización desconocida'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">        
                    {formatDistanceToNow(new Date(sub.updatedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
              <Badge
                variant={sub.status === "active" ? "default" : "secondary"}
                className="ml-2 flex-shrink-0"
              >
                {sub.plan?.name || 'Sin plan'}
              </Badge>
            </div>
          ))
      )}
    </div>
  )
}
