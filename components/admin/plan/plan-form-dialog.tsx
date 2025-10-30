"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SerializedSubscriptionPlanWithStats } from "./types"

// Módulos disponibles para los planes
const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'Panel principal con estadísticas' },
  { id: 'customers', label: 'Clientes', description: 'Gestión de clientes' },
  { id: 'analytics', label: 'Analytics', description: 'Reportes y estadísticas' },
]

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
  const [isLoading, setIsLoading] = useState(false)

  // Resetear el formulario cuando el modal se abre o se cambia el plan
  useEffect(() => {
    if (plan) {
      setName(plan.name)
      setDescription(plan.description || "")
      setHasMonthly(plan.hasMonthly || false)
      setHasYearly(plan.hasYearly || false)
      setPriceMonthly(plan.priceMonthly ? Number(plan.priceMonthly) : 0)
      setPriceYearly(plan.priceYearly ? Number(plan.priceYearly) : 0)
      setMaxUsers(String(plan.maxUsers) || "")
      setMaxProducts(String(plan.maxProducts) || "")
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
      setSelectedModules([])
    }
  }, [plan, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar que al menos un período esté activo
      if (!hasMonthly && !hasYearly) {
        alert("Debes activar al menos un período (Mensual o Anual)")
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
        modules: selectedModules.length > 0 ? selectedModules : undefined,
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
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {plan ? "Editar Plan" : "Nuevo Plan"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {plan ? "Actualiza la información del plan" : "Completa la información para crear un nuevo plan de suscripción"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                Nombre del Plan *
              </Label>
              <Input
                id="name"
                placeholder="Ej: Starter, Básico, Professional"
                value={name}
                onChange={(e) => setName(capitalizeFirstLetter(e.target.value))}
                required
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe las características del plan"
                value={description}
                onChange={(e) => setDescription(capitalizeFirstLetter(e.target.value))}
                rows={3}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* Sección de Precios */}
            <div className="grid gap-4 pt-4 border-t">
              <Label className="text-gray-700 dark:text-gray-300 font-semibold">
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
                  <Label htmlFor="hasMonthly" className="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                    Plan Mensual
                  </Label>
                </div>
                {hasMonthly && (
                  <div className="ml-7">
                    <Label htmlFor="priceMonthly" className="text-gray-600 dark:text-gray-400 text-sm">
                      Precio Mensual *
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
                      className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
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
                  <Label htmlFor="hasYearly" className="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                    Plan Anual
                  </Label>
                </div>
                {hasYearly && (
                  <div className="ml-7">
                    <Label htmlFor="priceYearly" className="text-gray-600 dark:text-gray-400 text-sm">
                      Precio Anual *
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
                      className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Límites */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="maxUsers" className="text-gray-700 dark:text-gray-300">
                  Máx. Usuarios
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  placeholder="Ilimitado"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  min="1"
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxProducts" className="text-gray-700 dark:text-gray-300">
                  Máx. Productos
                </Label>
                <Input
                  id="maxProducts"
                  type="number"
                  placeholder="Ilimitado"
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(e.target.value)}
                  min="1"
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Módulos */}
            <div className="grid gap-4 border-t pt-4">
              <Label className="text-gray-700 dark:text-gray-300 font-semibold">
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

          <DialogFooter className="bg-gray-50 dark:bg-[#2a2a2a] -mx-6 -mb-6 px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] !flex !justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              rounded="full"
              disabled={isLoading || !name.trim() || (!hasMonthly && !hasYearly)}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              {isLoading ? "Guardando..." : plan ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

