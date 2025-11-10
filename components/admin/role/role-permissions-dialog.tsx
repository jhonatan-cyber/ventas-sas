"use client"

import { Loader2, Shield, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PermissionInfo, PermissionAdminService } from "@/lib/services/admin/permission-admin-service"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleWithStats | undefined
  onSave: (permissions: string[]) => Promise<void>
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
  onSave,
}: RolePermissionsDialogProps) {
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar permisos disponibles cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadPermissions()
      // Cargar permisos del rol actual
      if (role) {
        const rolePermissions = (role.permissions as string[]) || []
        setSelectedPermissions([...rolePermissions])
      } else {
        setSelectedPermissions([])
      }
    }
  }, [open, role])

  const loadPermissions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/administracion/permisos")
      if (!response.ok) {
        throw new Error("Error al cargar permisos")
      }
      const permissions = await response.json()
      setAllPermissions(permissions)
    } catch (error) {
      console.error("Error al cargar permisos:", error)
      toast.error("Error al cargar permisos", {
        description: "No se pudieron cargar los permisos disponibles",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    )
  }

  const handleSelectAll = () => {
    setSelectedPermissions(allPermissions.map((p) => p.name))
  }

  const handleDeselectAll = () => {
    setSelectedPermissions([])
  }

  // Extraer módulo del nombre del permiso (formato: modulo_accion)
  const getModuleFromPermission = (permissionName: string): string => {
    const parts = permissionName.split('_')
    return parts[0] || 'unknown'
  }

  const handleSelectModule = (module: string) => {
    const modulePermissions = allPermissions
      .filter((p) => getModuleFromPermission(p.name) === module)
      .map((p) => p.name)
    setSelectedPermissions((prev) => {
      const newPerms = [...prev]
      modulePermissions.forEach((perm) => {
        if (!newPerms.includes(perm)) {
          newPerms.push(perm)
        }
      })
      return newPerms
    })
  }

  const handleDeselectModule = (module: string) => {
    const modulePermissions = allPermissions
      .filter((p) => getModuleFromPermission(p.name) === module)
      .map((p) => p.name)
    setSelectedPermissions((prev) =>
      prev.filter((perm) => !modulePermissions.includes(perm))
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(selectedPermissions)
      toast.success("Permisos actualizados", {
        description: `Los permisos de ${role?.name} han sido actualizados exitosamente.`,
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al guardar permisos:", error)
      toast.error("Error al guardar permisos", {
        description: error.message || "No se pudieron actualizar los permisos",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Agrupar permisos por módulo
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    const module = getModuleFromPermission(perm.name)
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(perm)
    return acc
  }, {} as Record<string, PermissionInfo[]>)

  // Obtener etiquetas de módulos
  const availableModules = PermissionAdminService.getAvailableModules()
  const moduleLabels = new Map(availableModules.map(m => [m.id, m.label]))

  // Ordenar módulos según el orden de availableModules
  const modules = availableModules
    .filter(m => permissionsByModule[m.id])
    .map(m => m.id)

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur shrink-0">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Gestionar Permisos - {role.name}
            </DialogTitle>
            <DialogDescription>
              Selecciona los permisos que deseas asignar a este rol
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Barra de acciones rápidas */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50/60 dark:bg-[#0c0c0c] flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPermissions.length} de {allPermissions.length} permisos seleccionados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="rounded-full text-xs"
                  >
                    Seleccionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="rounded-full text-xs"
                  >
                    Deseleccionar Todos
                  </Button>
                </div>
              </div>

              {/* Lista de permisos por módulo con acordeones - Área scrolleable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-6 py-4">
                  <Accordion type="multiple" className="w-full" defaultValue={modules}>
                  {modules.map((module) => {
                    const modulePerms = permissionsByModule[module]
                    const selectedCount = modulePerms.filter((p) =>
                      selectedPermissions.includes(p.name)
                    ).length
                    const allSelected = selectedCount === modulePerms.length
                    const someSelected = selectedCount > 0 && selectedCount < modulePerms.length
                    const moduleLabel = moduleLabels.get(module) || module

                    return (
                      <AccordionItem key={module} value={module} className="border-b border-gray-200 dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="relative">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSelectModule(module)
                                } else {
                                  handleDeselectModule(module)
                                }
                              }}
                              className={someSelected ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" : ""}
                            />
                            {someSelected && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-2 h-0.5 bg-white rounded" />
                              </div>
                            )}
                          </div>
                          <AccordionTrigger className="flex-1 hover:no-underline py-0">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {moduleLabel}
                                </Label>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCount}/{modulePerms.length}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                            {modulePerms.map((permission) => (
                              <div
                                key={permission.name}
                                className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                              >
                                <Checkbox
                                  id={`perm-${permission.name}`}
                                  checked={selectedPermissions.includes(permission.name)}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(permission.name)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label
                                    htmlFor={`perm-${permission.name}`}
                                    className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white block"
                                  >
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                  </Accordion>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto rounded-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Guardar Permisos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

