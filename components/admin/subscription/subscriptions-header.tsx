"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface SubscriptionsHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function SubscriptionsHeader({
  title,
  description,
  newButtonText = "Agregar Suscripción",
  onNewClick
}: SubscriptionsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
      <div className="w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Button 
        variant="outline" 
        rounded="full" 
        onClick={onNewClick}
        className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
        {newButtonText}
      </Button>
    </div>
  )
}

