"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface CashRegistersHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
  newButtonDisabled?: boolean
}

export function CashRegistersHeader({
  title,
  description,
  newButtonText = "Nuevo",
  onNewClick,
  newButtonDisabled = false
}: CashRegistersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Button 
        variant="new" 
        rounded="full" 
        className="rounded-full w-full sm:w-auto"
        onClick={onNewClick}
        disabled={newButtonDisabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        {newButtonText}
      </Button>
    </div>
  )
}

