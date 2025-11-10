"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const AVAILABLE_MODULES = [
  { id: "dashboard", label: "Dashboard", description: "Panel principal con estadísticas" },
  { id: "customers", label: "Clientes", description: "Gestión de clientes" },
  { id: "analytics", label: "Analytics", description: "Reportes y estadísticas" }
]

export interface PlanFormValues {
  id?: string
  name: string
  description?: string | null
  hasMonthly?: boolean
  hasYearly?: boolean
  priceMonthly?: number | null
  priceYearly?: number | null
  maxUsers?: number | null
  maxProducts?: number | null
  maxBranches?: number | null
  modules?: string[] | null
  features?: string[] | null
  isActive?: boolean | null
}

interface PlanFormProps {
  plan?: PlanFormValues | null
}

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hasMonthly, setHasMonthly] = useState(false)
  const [hasYearly, setHasYearly] = useState(false)
  const [priceMonthly, setPriceMonthly] = useState<string>("")
  const [priceYearly, setPriceYearly] = useState<string>("")
  const [maxUsers, setMaxUsers] = useState<string>("")
  const [maxProducts, setMaxProducts] = useState<string>("")
  const [maxBranches, setMaxBranches] = useState<string>("")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (plan) {
      setName(plan.name || "")
      setDescription(plan.description || "")
      setHasMonthly(Boolean(plan.hasMonthly))
      setHasYearly(Boolean(plan.hasYearly))
      setPriceMonthly(
        plan.hasMonthly && plan.priceMonthly !== null && plan.priceMonthly !== undefined
          ? String(plan.priceMonthly)
          : ""
      )
      setPriceYearly(
        plan.hasYearly && plan.priceYearly !== null && plan.priceYearly !== undefined
          ? String(plan.priceYearly)
          : ""
      )
      setMaxUsers(
        plan.maxUsers !== null && plan.maxUsers !== undefined ? String(plan.maxUsers) : ""
      )
      setMaxProducts(
        plan.maxProducts !== null && plan.maxProducts !== undefined
          ? String(plan.maxProducts)
          : ""
      )
      setMaxBranches(
        plan.maxBranches !== null && plan.maxBranches !== undefined
          ? String(plan.maxBranches)
          : ""
      )
      setSelectedModules(Array.isArray(plan.modules) ? plan.modules : [])
      setIsActive(plan.isActive ?? true)
    } else {
      setName("")
      setDescription("")
      setHasMonthly(false)
      setHasYearly(false)
      setPriceMonthly("")
      setPriceYearly("")
      setMaxUsers("")
      setMaxProducts("")
      setMaxBranches("")
      setSelectedModules([])
      setIsActive(true)
    }
  }, [plan])

  const isFormValid = useMemo(() => {
    if (!name.trim()) return false
    if (!hasMonthly && !hasYearly) return false
    if (hasMonthly && priceMonthly === "") return false
    if (hasYearly && priceYearly === "") return false
    return true
  }, [name, hasMonthly, hasYearly, priceMonthly, priceYearly])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      hasMonthly,
      hasYearly,
      priceMonthly:
        hasMonthly && priceMonthly !== "" ? parseFloat(priceMonthly) : null,
      priceYearly:
        hasYearly && priceYearly !== "" ? parseFloat(priceYearly) : null,
      maxUsers: maxUsers ? parseInt(maxUsers, 10) : null,
      maxProducts: maxProducts ? parseInt(maxProducts, 10) : null,
      maxBranches: maxBranches ? parseInt(maxBranches, 10) : null,
      modules: selectedModules.length ? selectedModules : null,
      isActive
    }

    const endpoint = plan?.id
      ? `/api/administracion/plans/${plan.id}`
      : "/api/administracion/plans"
    const method = plan?.id ? "PUT" : "POST"

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "No se pudo guardar el plan")
      }

      toast.success(plan?.id ? "Plan actualizado" : "Plan creado")
      router.push("/administracion/plans")
      router.refresh()
    } catch (error: any) {
      console.error("Error guardando plan", error)
      toast.error(error.message || "Error al guardar el plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan-name">Nombre del Plan *</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Starter, Profesional"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-description">Descripción</Label>
          <Textarea
            id="plan-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe brevemente las características del plan"
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Períodos de facturación
        </h2>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="has-monthly"
            checked={hasMonthly}
            onCheckedChange={(checked) => setHasMonthly(Boolean(checked))}
          />
          <Label htmlFor="has-monthly" className="cursor-pointer">
            Activar plan mensual
          </Label>
        </div>
        {hasMonthly && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="price-monthly">Precio mensual *</Label>
            <Input
              id="price-monthly"
              type="number"
              step="0.01"
              min="0"
              value={priceMonthly}
              onChange={(event) => setPriceMonthly(event.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <Checkbox
            id="has-yearly"
            checked={hasYearly}
            onCheckedChange={(checked) => setHasYearly(Boolean(checked))}
          />
          <Label htmlFor="has-yearly" className="cursor-pointer">
            Activar plan anual
          </Label>
        </div>
        {hasYearly && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="price-yearly">Precio anual *</Label>
            <Input
              id="price-yearly"
              type="number"
              step="0.01"
              min="0"
              value={priceYearly}
              onChange={(event) => setPriceYearly(event.target.value)}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="max-users">Máx. Usuarios</Label>
          <Input
            id="max-users"
            type="number"
            min="1"
            value={maxUsers}
            onChange={(event) => setMaxUsers(event.target.value)}
            placeholder="Ilimitado"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-products">Máx. Productos</Label>
          <Input
            id="max-products"
            type="number"
            min="1"
            value={maxProducts}
            onChange={(event) => setMaxProducts(event.target.value)}
            placeholder="Ilimitado"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-branches">Máx. Sucursales</Label>
          <Input
            id="max-branches"
            type="number"
            min="1"
            value={maxBranches}
            onChange={(event) => setMaxBranches(event.target.value)}
            placeholder="Ilimitado"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Módulos incluidos
        </h2>
        <div className="grid gap-3">
          {AVAILABLE_MODULES.map((module) => {
            const isChecked = selectedModules.includes(module.id)
            return (
              <div key={module.id} className="flex items-start space-x-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <Checkbox
                  id={`module-${module.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked && !isChecked) {
                      setSelectedModules((prev) => [...prev, module.id])
                    } else if (!checked && isChecked) {
                      setSelectedModules((prev) => prev.filter((id) => id !== module.id))
                    }
                  }}
                />
                <Label htmlFor={`module-${module.id}`} className="cursor-pointer flex-1">
                  <span className="block font-medium text-gray-900 dark:text-gray-100">
                    {module.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {module.description}
                  </span>
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">Plan activo</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controla si el plan está disponible para ser asignado a organizaciones
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/administracion/plans")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Guardando..." : plan?.id ? "Actualizar plan" : "Crear plan"}
        </Button>
      </div>
    </form>
  )
}


