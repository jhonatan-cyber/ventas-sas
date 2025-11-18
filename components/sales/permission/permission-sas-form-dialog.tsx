"use client"

import { useTranslations } from "next-intl"

import { Loader2, CheckSquare2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PermissionSasService } from "@/lib/services/sales/permission-sas-service"

interface PermissionSasFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  customerSlug: string
  maxBranches?: number | null
}

export function PermissionSasFormDialog({ open, onOpenChange, onSuccess, customerSlug, maxBranches }: PermissionSasFormDialogProps) {
  const t = useTranslations()
  const [selectedModule, setSelectedModule] = useState<string>("")
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [existingPermissionNames, setExistingPermissionNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingExistingPermissions, setLoadingExistingPermissions] = useState(false)

  // Obtener módulos disponibles y filtrar:
  // - "dashboard" (todos pueden verlo, se maneja con reglas en el módulo)
  // - "sucursales" si maxBranches === 1
  const allModules = PermissionSasService.getAvailableModules()
  const modules = useMemo(() => {
    let filtered = allModules.filter(module => module.id !== 'dashboard')
    
    if (maxBranches === 1) {
      filtered = filtered.filter(module => module.id !== 'sucursales')
    }
    
    return filtered
  }, [allModules, maxBranches])
  
  // Usar useMemo para que actions sea estable y no cause re-renders infinitos
  const actions = useMemo(() => PermissionSasService.getAvailableActions(), [])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedModule("")
      setSelectedActions([])
      setExistingPermissionNames([])
    }
  }, [open])

  // Cargar permisos existentes cuando se selecciona un módulo
  useEffect(() => {
    if (!selectedModule) {
      setSelectedActions([])
      setExistingPermissionNames([])
      return
    }

    let cancelled = false

    const loadExistingPermissions = async () => {
      setLoadingExistingPermissions(true)
      try {
        const response = await fetch(`/api/${customerSlug}/permisos`)
        if (!response.ok) {
          throw new Error("Error al cargar permisos existentes")
        }

        const allPermissions: Array<{ name: string }> = await response.json()
        
        if (cancelled) return
        
        // Filtrar permisos del módulo seleccionado
        const modulePermissions = allPermissions.filter(perm => 
          perm.name.startsWith(`${selectedModule}_`)
        )

        // Extraer las acciones de los permisos existentes
        const existingActions: string[] = []
        const existingNames: string[] = []
        
        actions.forEach(action => {
          const permissionName = PermissionSasService.generatePermissionName(selectedModule, action.id)
          if (modulePermissions.some(p => p.name === permissionName)) {
            existingActions.push(action.id)
            existingNames.push(permissionName)
          }
        })

        if (!cancelled) {
          setSelectedActions(existingActions)
          setExistingPermissionNames(existingNames)
        }
      } catch (error) {
        console.error("Error al cargar permisos existentes:", error)
        if (!cancelled) {
          setSelectedActions([])
        }
      } finally {
        if (!cancelled) {
          setLoadingExistingPermissions(false)
        }
      }
    }

    loadExistingPermissions()

    return () => {
      cancelled = true
    }
  }, [selectedModule, customerSlug, actions])

  const handleActionToggle = (actionId: string) => {
    setSelectedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const handleSelectAllActions = () => {
    if (selectedModule) {
      setSelectedActions(actions.map(action => action.id))
    }
  }

  const handleSubmit = async () => {
    if (!selectedModule) {
      toast.error(t('permissions.sas.moduleRequired'))
      return
    }

    if (selectedActions.length === 0) {
      toast.error(t('permissions.sas.actionsRequired'))
      return
    }

    setIsLoading(true)

    try {
      const existingPermissionsResponse = await fetch(`/api/${customerSlug}/permisos`)
      const existingPermissions: Array<{ name: string }> = existingPermissionsResponse.ok 
        ? await existingPermissionsResponse.json()
        : []

      const allPermissions = selectedActions.map(action =>
        PermissionSasService.generatePermissionName(selectedModule, action)
      )

      const newPermissions = allPermissions.filter(perm =>
        !existingPermissions.some(existing => existing.name === perm)
      )

      if (newPermissions.length === 0) {
        toast.info("Todos los permisos ya están registrados", {
          description: `Todos los permisos seleccionados para el módulo ${modules.find(m => m.id === selectedModule)?.label} ya existen en el sistema`,
        })
        onSuccess()
        onOpenChange(false)
        setIsLoading(false)
        return
      }

      const newActions = selectedActions.filter(action => {
        const permissionName = PermissionSasService.generatePermissionName(selectedModule, action)
        return newPermissions.includes(permissionName)
      })

      const response = await fetch(`/api/${customerSlug}/permisos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: selectedModule,
          actions: newActions,
          permissions: newPermissions,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear los permisos")
      }

      const existingCount = allPermissions.length - newPermissions.length
      const message = existingCount > 0
        ? `Se han creado ${newPermissions.length} permiso(s) nuevo(s). ${existingCount} permiso(s) ya existían.`
        : `Se han creado ${newPermissions.length} permiso(s) para el módulo ${modules.find(m => m.id === selectedModule)?.label}`

      toast.success(t('permissions.sas.registeredSuccess'), {
        description: message,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al crear permisos:", error)
      toast.error(t('permissions.sas.errorRegistering'), {
        description: error.message || "No se pudieron crear los permisos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedModuleLabel = modules.find(m => m.id === selectedModule)?.label || ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>Registrar Nuevos Permisos</DialogTitle>
            <DialogDescription>
              Selecciona un módulo y las acciones que deseas registrar como permisos
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
          {/* Módulo y Marcar Todos - En una fila de 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="module" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Módulo
              </Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger id="module" className="rounded-full w-full">
                  <SelectValue placeholder={t('common.placeholders.selectModule')} />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 opacity-0 pointer-events-none">
                Acciones
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllActions}
                disabled={loadingExistingPermissions || !selectedModule}
                className="rounded-full text-xs whitespace-nowrap"
              >
                <CheckSquare2 className="h-3 w-3 mr-1" />
                Marcar Todos
              </Button>
            </div>
          </div>

          {loadingExistingPermissions && selectedModule && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Cargando permisos existentes...
            </div>
          )}

          {selectedModule && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
                {actions.map((action) => {
                  const permissionName = PermissionSasService.generatePermissionName(
                    selectedModule,
                    action.id
                  )
                  const description = PermissionSasService.generatePermissionDescription(
                    selectedModule,
                    action.id
                  )
                  const isChecked = selectedActions.includes(action.id)

                  return (
                    <div key={action.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`action-${action.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleActionToggle(action.id)}
                        className="mt-1"
                        disabled={loadingExistingPermissions}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`action-${action.id}`}
                            className="cursor-pointer font-medium text-gray-900 dark:text-white"
                          >
                            {action.label}
                          </Label>
                          {isChecked && existingPermissionNames.includes(permissionName) && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                              Existente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {permissionName}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedModule && selectedActions.length > 0 && (() => {
            const newPermissions = selectedActions
              .map(action => PermissionSasService.generatePermissionName(selectedModule, action))
              .filter(name => !existingPermissionNames.includes(name))
            
            const existingCount = selectedActions.length - newPermissions.length

            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Permisos seleccionados ({selectedActions.length}):
                  {existingCount > 0 && (
                    <span className="ml-2 text-xs font-normal text-green-700 dark:text-green-300">
                      ({existingCount} existente(s), {newPermissions.length} nuevo(s))
                    </span>
                  )}
                </p>
                <ul className="space-y-1">
                  {selectedActions.map((action) => {
                    const permissionName = PermissionSasService.generatePermissionName(
                      selectedModule,
                      action
                    )
                    const isExisting = existingPermissionNames.includes(permissionName)
                    return (
                      <li key={action} className="text-xs font-mono text-blue-700 dark:text-blue-300 flex items-center gap-2 flex-wrap">
                        <span>• {permissionName}</span>
                        {isExisting && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Ya existe
                          </span>
                        )}
                        {!isExisting && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            Nuevo
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })()}
        </div>

        <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedModule || selectedActions.length === 0 || isLoading}
            className="w-full sm:w-auto rounded-full px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Agregando...
              </>
            ) : (
              "Agregar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

