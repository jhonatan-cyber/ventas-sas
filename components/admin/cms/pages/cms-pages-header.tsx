"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CmsPagesHeaderProps {
  onNewClick: () => void
}

export function CmsPagesHeader({ onNewClick }: CmsPagesHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Páginas CMS
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las páginas estáticas del sistema de contenido
          </p>
        </div>
        <Button onClick={onNewClick} className="rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Página
        </Button>
      </div>
    </div>
  )
}

