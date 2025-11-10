"use client"

import { Plus, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface CustomerOrganizationsHeaderProps {
  onAddClick: () => void
}

export function CustomerOrganizationsHeader({ onAddClick }: CustomerOrganizationsHeaderProps) {
  const canCreate = useHasPermission("organizaciones_crear")

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          Organizaciones de Clientes
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Gestiona las organizaciones asociadas a cada cliente
        </p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                onClick={onAddClick}
                className="w-full rounded-full sm:w-auto"
                disabled={!canCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Organización
              </Button>
            </span>
          </TooltipTrigger>
          {!canCreate && (
            <TooltipContent>
              <p>No tienes permiso para crear organizaciones</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

