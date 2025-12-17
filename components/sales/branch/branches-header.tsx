"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BranchesHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick?: () => void
  showNewButton?: boolean
}

export function BranchesHeader({
  title,
  description,
  newButtonText = "Nuevo",
  onNewClick,
  showNewButton = true
}: BranchesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      {showNewButton && (
        <Button 
          variant="new" 
          onClick={onNewClick}
          className="w-full sm:w-auto rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {newButtonText}
        </Button>
      )}
    </div>
  )
}

