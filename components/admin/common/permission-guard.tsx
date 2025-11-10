"use client"

import { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface PermissionGuardProps {
  permission: string
  fallback?: ReactNode
  children: ReactNode
  showTooltip?: boolean
  tooltipMessage?: string
}

/**
 * Componente que muestra contenido solo si el usuario tiene el permiso necesario
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
  showTooltip = false,
  tooltipMessage
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission)

  if (hasPermission) {
    return <>{children}</>
  }

  if (showTooltip && tooltipMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{fallback}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <>{fallback}</>
}

interface PermissionButtonProps {
  permission: string
  onClick: () => void
  children: ReactNode
  variant?: "default" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
  tooltipMessage?: string
  [key: string]: any
}

/**
 * Botón que se deshabilita si el usuario no tiene el permiso necesario
 */
export function PermissionButton({
  permission,
  onClick,
  children,
  variant = "ghost",
  size = "sm",
  className = "",
  disabled = false,
  tooltipMessage,
  ...props
}: PermissionButtonProps) {
  const hasPermission = useHasPermission(permission)
  const isDisabled = disabled || !hasPermission

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isDisabled}
      className={`${className} ${!hasPermission ? "disabled:opacity-50 disabled:cursor-not-allowed" : ""}`}
      {...props}
    >
      {children}
    </Button>
  )

  if (!hasPermission && tooltipMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

interface ActionButtonProps {
  permission: string
  onClick: () => void
  icon: ReactNode
  tooltip: string
  className?: string
  variant?: "ghost" | "outline" | "default" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Botón de acción estándar con permiso y tooltip
 */
export function ActionButton({
  permission,
  onClick,
  icon,
  tooltip,
  className = "",
  variant = "ghost",
  size = "sm"
}: ActionButtonProps) {
  const hasPermission = useHasPermission(permission)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant={variant}
              size={size}
              onClick={onClick}
              disabled={!hasPermission}
              className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {icon}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {hasPermission ? tooltip : `No tiene permiso para ${tooltip.toLowerCase()}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Hook para obtener permisos de un módulo específico
 */
export function useModulePermissions(module: string) {
  return {
    canList: useHasPermission(`${module}_listar`),
    canViewDetails: useHasPermission(`${module}_ver_detalles`),
    canCreate: useHasPermission(`${module}_crear`),
    canEdit: useHasPermission(`${module}_editar`),
    canDelete: useHasPermission(`${module}_eliminar`),
    canActivate: useHasPermission(`${module}_activar`),
    canDeactivate: useHasPermission(`${module}_desactivar`),
  }
}

