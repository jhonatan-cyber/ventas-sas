"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

interface SalesHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
  disabled?: boolean
}

export function SalesHeader({ title, description, newButtonText, onNewClick, disabled = false }: SalesHeaderProps) {
  const t = useTranslations()
  const defaultNewText = newButtonText || t('action.new')
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl">{description}</p>
      </div>
      <Button 
        variant="new" 
        rounded="full" 
        onClick={onNewClick} 
        disabled={disabled}
        className="shrink-0 w-full sm:w-auto"
        title={disabled ? "Debe haber al menos una caja abierta para crear una venta" : undefined}
      >
        <Plus className="h-4 w-4 mr-2" />
        {defaultNewText}
      </Button>
    </div>
  )
}
