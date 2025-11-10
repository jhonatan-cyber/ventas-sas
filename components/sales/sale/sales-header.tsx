"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SalesHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function SalesHeader({ title, description, newButtonText = "Nuevo", onNewClick }: SalesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">{description}</p>
      </div>
      <Button variant="new" rounded="full" onClick={onNewClick} className="shrink-0">
        <Plus className="h-4 w-4" />
        {newButtonText}
      </Button>
    </div>
  )
}
