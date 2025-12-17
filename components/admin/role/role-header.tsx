"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface RoleHeaderProps {
  title: string
  description: string
  newButtonText?: string
  onNewClick: () => void
}

export function RoleHeader({
  title,
  description,
  newButtonText = "Agregar Rol",
  onNewClick
}: RoleHeaderProps) {const canCreate = useHasPermission("roles_crear")

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
      <div className="w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button 
                variant="outline" 
                rounded="full" 
                onClick={onNewClick}
                disabled={!canCreate}
                className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {newButtonText}
              </Button>
            </span>
          </TooltipTrigger>
          {!canCreate && (
            <TooltipContent>
              <p>{"No Permission To Create"}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
