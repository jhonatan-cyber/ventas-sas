"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface UsuariosSasHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function UsuariosSasHeader({
  title,
  description,
  newButtonText = "Nuevo",
  onNewClick
}: UsuariosSasHeaderProps) {
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
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus className="h-4 w-4" />
        {newButtonText}
      </Button>
    </div>
  )
}

