"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

interface ReportDateQuickFiltersProps {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
  onApply?: (startDate: string, endDate: string) => void
}

function formatYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function ReportDateQuickFilters({
  startDate,
  endDate,
  onChange,
  onApply,
}: ReportDateQuickFiltersProps) {
  const t = useTranslations()

  const setToday = () => {
    const now = new Date()
    const d = formatYmd(now)
    onChange(d, d)
    onApply?.(d, d)
  }

  const setThisWeek = () => {
    const now = new Date()
    const day = now.getDay() // 0 = domingo
    const diffToMonday = (day + 6) % 7
    const start = new Date(now)
    start.setDate(now.getDate() - diffToMonday)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const s = formatYmd(start)
    const e = formatYmd(end)
    onChange(s, e)
    onApply?.(s, e)
  }

  const setThisMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const s = formatYmd(start)
    const e = formatYmd(end)
    onChange(s, e)
    onApply?.(s, e)
  }

  const setLast30Days = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29)
    const s = formatYmd(start)
    const e = formatYmd(end)
    onChange(s, e)
    onApply?.(s, e)
  }

  const setThisYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    const s = formatYmd(start)
    const e = formatYmd(end)
    onChange(s, e)
    onApply?.(s, e)
  }

  const isActive = (rangeCheck: () => { start: string; end: string }) => {
    const { start, end } = rangeCheck()
    return startDate === start && endDate === end
  }

  // Helper para obtener traducciones con fallback seguro (evita errores MISSING_MESSAGE)
  const safeLabel = (key: string, fallback: string) => {
    try {
      return t(key)
    } catch {
      return fallback
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mr-1">
        {t("reports.filters.dateRange")}
      </span>
      <Button
        type="button"
        variant={isActive(() => {
          const now = new Date()
          const d = formatYmd(now)
          return { start: d, end: d }
        }) ? "default" : "outline"}
        size="sm"
        className="rounded-full h-6 px-3"
        onClick={setToday}
      >
        {safeLabel("reports.filters.quick.today", "Hoy")}
      </Button>
      <Button
        type="button"
        variant={isActive(() => {
          const now = new Date()
          const day = now.getDay()
          const diffToMonday = (day + 6) % 7
          const start = new Date(now)
          start.setDate(now.getDate() - diffToMonday)
          const end = new Date(start)
          end.setDate(start.getDate() + 6)
          return { start: formatYmd(start), end: formatYmd(end) }
        }) ? "default" : "outline"}
        size="sm"
        className="rounded-full h-6 px-3"
        onClick={setThisWeek}
      >
        {safeLabel("reports.filters.quick.thisWeek", "Esta semana")}
      </Button>
      <Button
        type="button"
        variant={isActive(() => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), 1)
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          return { start: formatYmd(start), end: formatYmd(end) }
        }) ? "default" : "outline"}
        size="sm"
        className="rounded-full h-6 px-3"
        onClick={setThisMonth}
      >
        {safeLabel("reports.filters.quick.thisMonth", "Este mes")}
      </Button>
      <Button
        type="button"
        variant={isActive(() => {
          const end = new Date()
          const start = new Date()
          start.setDate(end.getDate() - 29)
          return { start: formatYmd(start), end: formatYmd(end) }
        }) ? "default" : "outline"}
        size="sm"
        className="rounded-full h-6 px-3"
        onClick={setLast30Days}
      >
        {safeLabel("reports.filters.quick.last30Days", "Últimos 30 días")}
      </Button>
      <Button
        type="button"
        variant={isActive(() => {
          const now = new Date()
          const start = new Date(now.getFullYear(), 0, 1)
          const end = new Date(now.getFullYear(), 11, 31)
          return { start: formatYmd(start), end: formatYmd(end) }
        }) ? "default" : "outline"}
        size="sm"
        className="rounded-full h-6 px-3"
        onClick={setThisYear}
      >
        {safeLabel("reports.filters.quick.thisYear", "Este año")}
      </Button>
    </div>
  )
}


