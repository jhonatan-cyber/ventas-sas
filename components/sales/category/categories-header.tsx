"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CategoriesHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function CategoriesHeader({
  title,
  description,
  newButtonText = "Nueva",
  onNewClick
}: CategoriesHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Button 
        variant="new" 
        className="rounded-full"
        onClick={onNewClick}
      >
        <Plus className="h-4 w-4" />
        {newButtonText}
      </Button>
    </div>
  )
}

