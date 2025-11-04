"use client"

import { Widget } from "./types"
import { StatsWidget } from "./stats-widget"
import { HealthWidget } from "./health-widget"
import { ActivityWidget } from "./activity-widget"
import { RecentSubscriptionsWidget } from "./recent-subscriptions-widget"

interface WidgetRendererProps {
  widget: Widget
  data: any
}

export function WidgetRenderer({ widget, data }: WidgetRendererProps) {
  if (!data) {
    return <div className="text-sm text-gray-500">Cargando datos...</div>
  }

  switch (widget.type) {
    case "stats":
      return <StatsWidget data={data} />
    case "health":
      return <HealthWidget data={data} />
    case "activity":
      return <ActivityWidget data={data} />
    case "recent-subscriptions":
      return <RecentSubscriptionsWidget data={data} />
    default:
      return <div>Widget no encontrado: {widget.type}</div>
  }
}
