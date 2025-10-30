"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PlanHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function PlanHeader({
  title,
  description,
  newButtonText = "Nuevo",
  onNewClick
}: PlanHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Button 
        variant="outline" 
        rounded="full" 
        onClick={onNewClick}
        className="bg-black dark:bg-white text-white dark:text-black hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
        {newButtonText}
      </Button>
    </div>
  )
}

