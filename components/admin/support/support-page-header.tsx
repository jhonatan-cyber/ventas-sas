"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SupportPageHeaderProps {
  onNewTicketClick: () => void
}

export function SupportPageHeader({ onNewTicketClick }: SupportPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Tickets de Soporte
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Gestiona los tickets de soporte de las organizaciones
        </p>
      </div>
      <Button onClick={onNewTicketClick} className="rounded-full">
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Ticket
      </Button>
    </div>
  )
}

