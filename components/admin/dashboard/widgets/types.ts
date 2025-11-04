export type WidgetType =
  | 'stats'
  | 'organizations'
  | 'users'
  | 'revenue'
  | 'health'
  | 'activity'
  | 'recent-subscriptions'
  | 'system-metrics'

export interface Widget {
  id: string
  type: WidgetType
  title: string
  enabled: boolean
  order: number
  size: 'small' | 'medium' | 'large'
}

export interface WidgetLayout {
  widgets: Widget[]
  columns: number
}

export const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'stats',
    type: 'stats',
    title: 'Estadísticas Principales',
    enabled: true,
    order: 0,
    size: 'large',
  },
  {
    id: 'health',
    type: 'health',
    title: 'Salud del Sistema',
    enabled: true,
    order: 1,
    size: 'medium',
  },
  {
    id: 'activity',
    type: 'activity',
    title: 'Actividad Reciente',
    enabled: true,
    order: 2,
    size: 'medium',
  },
  {
    id: 'recent-subscriptions',
    type: 'recent-subscriptions',
    title: 'Suscripciones Recientes',
    enabled: true,
    order: 3,
    size: 'small',
  },
]

export const WIDGET_SIZES = {
  small: { cols: 1, rows: 1 },
  medium: { cols: 2, rows: 1 },
  large: { cols: 4, rows: 1 },
} as const
