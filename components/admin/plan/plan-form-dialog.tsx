"use client"

import { useState, useEffect } from "react"

import { SerializedSubscriptionPlanWithStats } from "./types"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SAS_MODULES_CONFIG } from "@/lib/config/sas-modules"

// Obtener todos los módulos del sistema SAS con sus descripciones desde la configuración centralizada
const AVAILABLE_MODULES = SAS_MODULES_CONFIG.map((module) => ({
  id: module.id,
  label: module.label,
  description: module.description,
}))

interface PlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: SerializedSubscriptionPlanWithStats
  onSave: (data: any) => void
}

// Función para capitalizar solo la primera letra
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function PlanFormDialog({ open, onOpenChange, plan, onSave }: PlanFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hasMonthly, setHasMonthly] = useState(false)
  const [hasYearly, setHasYearly] = useState(false)
  const [priceMonthly, setPriceMonthly] = useState(0)
  const [priceYearly, setPriceYearly] = useState(0)
  const [maxUsers, setMaxUsers] = useState("")
  const [maxProducts, setMaxProducts] = useState("")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [maxBranches, setMaxBranches] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Validar si el formulario es válido
  const isFormValid = name.trim() !== "" && (hasMonthly || hasYearly)

  // Resetear el formulario cuando el modal se abre o se cambia el plan
  useEffect(() => {
    if (plan) {
      setName(plan.name)
      setDescription(plan.description || "")
      setHasMonthly(plan.hasMonthly || false)
      setHasYearly(plan.hasYearly || false)
      setPriceMonthly(plan.priceMonthly ? Number(plan.priceMonthly) : 0)
      setPriceYearly(plan.priceYearly ? Number(plan.priceYearly) : 0)
      setMaxUsers(plan.maxUsers !== null && plan.maxUsers !== undefined ? String(plan.maxUsers) : "")
      setMaxProducts(plan.maxProducts !== null && plan.maxProducts !== undefined ? String(plan.maxProducts) : "")
      setMaxBranches(plan.maxBranches !== null && plan.maxBranches !== undefined ? String(plan.maxBranches) : "")
      setSelectedModules(Array.isArray(plan.modules) ? plan.modules : [])
    } else {
      setName("")
      setDescription("")
      setHasMonthly(false)
      setHasYearly(false)
      setPriceMonthly(0)
      setPriceYearly(0)
      setMaxUsers("")
      setMaxProducts("")
      setMaxBranches("")
      setSelectedModules([])
    }
  }, [plan, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar que al menos un período esté activo
      if (!hasMonthly && !hasYearly) {
        alert("Debes activar al menos un período ( Mensual o  Anual)")
        setIsLoading(false)
        return
      }

      const data: any = {
        name,
        description: description || undefined,
        hasMonthly,
        hasYearly,
        priceMonthly: hasMonthly ? (priceMonthly >= 0 ? priceMonthly : 0) : undefined,
        priceYearly: hasYearly ? (priceYearly >= 0 ? priceYearly : 0) : undefined,
        maxUsers: maxUsers ? parseInt(String(maxUsers)) : undefined,
        maxProducts: maxProducts ? parseInt(String(maxProducts)) : undefined,
        maxBranches: maxBranches ? parseInt(String(maxBranches)) : undefined,
        modules: selectedModules, // Siempre enviar el array, aunque esté vacío
        isActive: plan ? plan.isActive : true,
      }

      await onSave(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error al guardar el plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {plan ? "Editar Plan" : "Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              {plan ? "Actualiza la información del plan" : "Completa la información para crear un nuevo plan de suscripción"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Nombre del Plan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Starter, Básico, Professional"
                  value={name}
                  onChange={(e) => setName(capitalizeFirstLetter(e.target.value))}
                  required
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe las características del plan"
                  value={description}
                  onChange={(e) => setDescription(capitalizeFirstLetter(e.target.value))}
                  rows={3}
                  className="rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Sección de Precios */}
              <div className="grid gap-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Períodos de Facturación
                </Label>

                {/* Precio Mensual */}
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasMonthly"
                      checked={hasMonthly}
                      onCheckedChange={(checked) => setHasMonthly(checked as boolean)}
                    />
                    <Label htmlFor="hasMonthly" className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
                      Plan Mensual
                    </Label>
                  </div>
                  {hasMonthly && (
                    <div className="ml-7 space-y-2">
                      <Label htmlFor="priceMonthly" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Precio Mensual <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="priceMonthly"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={priceMonthly >= 0 ? priceMonthly : ""}
                        onChange={(e) => setPriceMonthly(parseFloat(e.target.value) ?? 0)}
                        required={hasMonthly}
                        min="0"
                        className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Precio Anual */}
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasYearly"
                      checked={hasYearly}
                      onCheckedChange={(checked) => setHasYearly(checked as boolean)}
                    />
                    <Label htmlFor="hasYearly" className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
                      Plan Anual
                    </Label>
                  </div>
                  {hasYearly && (
                    <div className="ml-7 space-y-2">
                      <Label htmlFor="priceYearly" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Precio Anual <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="priceYearly"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={priceYearly >= 0 ? priceYearly : ""}
                        onChange={(e) => setPriceYearly(parseFloat(e.target.value) ?? 0)}
                        required={hasYearly}
                        min="0"
                        className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Límites */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 dark:border-[#2a2a2a] pt-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Máx. Usuarios
                  </Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    placeholder="Ilimitado"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    min="1"
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxProducts" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Máx. Productos
                  </Label>
                  <Input
                    id="maxProducts"
                    type="number"
                    placeholder="Ilimitado"
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(e.target.value)}
                    min="1"
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBranches" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Máx. Sucursales
                  </Label>
                  <Input
                    id="maxBranches"
                    type="number"
                    placeholder="Ilimitado"
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(e.target.value)}
                    min="1"
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Módulos */}
              <div className="grid gap-4 border-t border-gray-200 dark:border-[#2a2a2a] pt-4">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Módulos Incluidos
                </Label>
                <div className="grid gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedModules([...selectedModules, module.id])
                          } else {
                            setSelectedModules(selectedModules.filter(id => id !== module.id))
                          }
                        }}
                      />
                      <Label htmlFor={`module-${module.id}`} className="cursor-pointer flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{module.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{module.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full px-6"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Guardando..." : plan ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

