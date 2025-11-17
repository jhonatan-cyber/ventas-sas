"use client"

import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences"

interface FormattedCurrencyProps {
  value: number | string
  slug?: string
}

interface FormattedDateProps {
  date: Date | string
  slug?: string
}

/**
 * Componente para formatear valores monetarios según las preferencias del usuario
 */
export function FormattedCurrency({ value, slug }: FormattedCurrencyProps) {
  const formatted = formatCurrencyWithPreferences(
    typeof value === 'string' ? parseFloat(value) : value,
    slug
  )
  return <span>{formatted}</span>
}

/**
 * Componente para formatear fechas según las preferencias del usuario
 */
export function FormattedDate({ date, slug }: FormattedDateProps) {
  const formatted = formatDateWithPreferences(date, slug)
  return <span>{formatted}</span>
}

