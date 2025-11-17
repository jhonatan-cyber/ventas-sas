"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

interface QuotationsHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
  newButtonDisabled?: boolean
}

export function QuotationsHeader({
  title,
  description,
  newButtonText,
  onNewClick,
  newButtonDisabled = false
}: QuotationsHeaderProps) {
  const t = useTranslations()
  const defaultNewText = newButtonText || t('action.new')
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Button 
        variant="new" 
        rounded="full" 
        onClick={onNewClick}
        disabled={newButtonDisabled}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        {defaultNewText}
      </Button>
    </div>
  )
}

