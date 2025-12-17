"use client"

import { MessageSquarePlus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SupportHeaderProps {
  title: string
  description: string
  onNewClick?: () => void
  loading?: boolean
  showNewButton?: boolean
}

export function SupportHeader({ title, description, onNewClick, loading = false, showNewButton = true }: SupportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl">{description}</p>
      </div>
      {showNewButton && onNewClick && (
        <Button 
          variant="new" 
          rounded="full" 
          onClick={onNewClick} 
          disabled={loading}
          className="shrink-0 w-full sm:w-auto"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Crear ticket
        </Button>
      )}
    </div>
  )
}

