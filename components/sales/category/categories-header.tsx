"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface CategoriesHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick?: () => void
  showNew?: boolean
}

export function CategoriesHeader({
  title,
  description,
  newButtonText = "Nueva",
  onNewClick,
  showNew = true
}: CategoriesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      {showNew && onNewClick && (
        <Button 
          variant="new" 
          rounded="full" 
          onClick={onNewClick}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {newButtonText}
        </Button>
      )}
    </div>
  )
}

