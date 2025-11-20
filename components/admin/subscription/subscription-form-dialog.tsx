"use client"

import { Calendar, Building2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Organization {
  id: string
  name: string
  slug: string
  razonSocial: string | null
  nit: string | null
}

interface Plan {
  id: string
  name: string
  priceMonthly: number | null
  priceYearly: number | null
}

interface SubscriptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: any
  onSave: (data: any) => void
}

export function SubscriptionFormDialog({ open, onOpenChange, subscription, onSave }: SubscriptionFormDialogProps) {
  const [organizationId, setOrganizationId] = useState("")
  const [planId, setPlanId] = useState("")
  const [billingPeriod, setBillingPeriod] = useState("monthly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [autoRenew, setAutoRenew] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [organizationsLoading, setOrganizationsLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(false)
  
  // Validar si el formulario es válido
  const isFormValid = organizationId.trim() !== "" && planId.trim() !== ""

  useEffect(() => {
    if (open) {
      loadOrganizations()
      loadPlans()
    }
  }, [open])

  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true)
      const response = await fetch('/api/administracion/organizations?pageSize=1000')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error al cargar organizaciones:', error)
    } finally {
      setOrganizationsLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      const response = await fetch('/api/administracion/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error al cargar planes:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  useEffect(() => {
    if (subscription) {
      setOrganizationId(subscription.organizationId || "")
      setPlanId(subscription.planId || "")
      setBillingPeriod(subscription.billingPeriod || "monthly")
      setStartDate(subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : "")
      setEndDate(subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : "")
      setAutoRenew(subscription.autoRenew ?? true)
    } else {
      setOrganizationId("")
      setPlanId("")
      setBillingPeriod("monthly")
      setStartDate("")
      setEndDate("")
      setAutoRenew(true)
    }
  }, [subscription, open])

  // Calcular automáticamente la fecha de fin basándose en el período de facturación y la fecha de inicio
  useEffect(() => {
    if (startDate && billingPeriod) {
      // Parsear la fecha de inicio (formato YYYY-MM-DD)
      const [year, month, day] = startDate.split('-').map(Number)
      const start = new Date(year, month - 1, day) // month - 1 porque los meses en Date son 0-indexed
      const end = new Date(start)
      
      if (billingPeriod === "monthly") {
        // Agregar 1 mes manteniendo el mismo día
        end.setMonth(end.getMonth() + 1)
      } else if (billingPeriod === "yearly") {
        // Agregar 1 año manteniendo el mismo día
        end.setFullYear(end.getFullYear() + 1)
      }
      
      // Formatear como YYYY-MM-DD sin problemas de zona horaria
      const formattedYear = end.getFullYear()
      const formattedMonth = String(end.getMonth() + 1).padStart(2, '0')
      const formattedDay = String(end.getDate()).padStart(2, '0')
      const formattedEndDate = `${formattedYear}-${formattedMonth}-${formattedDay}`
      
      setEndDate(formattedEndDate)
    }
  }, [startDate, billingPeriod])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data: any = {
        organizationId: organizationId,
        planId,
        billingPeriod,
        autoRenew,
        status: subscription ? subscription.status : 'active', // Solo para edición, creación siempre activo
      }

      // Convertir fechas a formato ISO datetime usando UTC medianoche del día especificado
      if (startDate) {
        // Parsear la fecha y crear en UTC medianoche para evitar problemas de zona horaria
        const [year, month, day] = startDate.split('-').map(Number)
        // Crear fecha en UTC medianoche del día especificado
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        data.startDate = utcDate.toISOString()
      }
      if (endDate) {
        // Parsear la fecha y crear en UTC medianoche para evitar problemas de zona horaria
        const [year, month, day] = endDate.split('-').map(Number)
        // Crear fecha en UTC medianoche del día especificado
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        data.endDate = utcDate.toISOString()
      }

      await onSave(data)
      onOpenChange(false)
      
      setOrganizationId("")
      setPlanId("")
      setBillingPeriod("monthly")
      setStartDate("")
      setEndDate("")
      setAutoRenew(true)
    } catch (error) {
      console.error("Error al guardar la suscripción:", error)
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
              {subscription ? "Editar Suscripción" : "Nueva Suscripción"}
            </DialogTitle>
            <DialogDescription>
              {subscription ? "Actualiza la información de la suscripción" : "Completa la información para crear una nueva suscripción"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Select value={organizationId} onValueChange={setOrganizationId} disabled={organizationsLoading || !!subscription}>
                  <SelectTrigger className="rounded-full w-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                    {organizationsLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando empresas...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={subscription ? "No se puede cambiar" : "Selecciona una empresa"} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] min-w-full">
                    {organizationsLoading ? (
                      <div className="px-2 py-8 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span>Cargando empresas...</span>
                      </div>
                    ) : organizations.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No hay empresas disponibles
                      </div>
                    ) : (
                      organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">
                          {organization.razonSocial || organization.name || 'Empresa sin nombre'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Select value={planId} onValueChange={setPlanId} disabled={plansLoading}>
                  <SelectTrigger className="rounded-full w-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                    {plansLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando planes...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Selecciona un plan" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] min-w-full">
                    {plansLoading ? (
                      <div className="px-2 py-8 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span>Cargando planes...</span>
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No hay planes disponibles
                      </div>
                    ) : (
                      plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">
                          {plan.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingPeriod" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Período de Facturación
                </Label>
                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                  <SelectTrigger className="rounded-full w-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecciona el período" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] min-w-full">
                    <SelectItem value="monthly" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">Mensual</SelectItem>
                    <SelectItem value="yearly" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Renovación Automática</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">La suscripción se renovará automáticamente</p>
                </div>
                <Switch
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Fecha de Inicio
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-full w-full pl-10 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Fecha de Fin
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-full w-full pl-10 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
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
              {isLoading ? "Guardando..." : subscription ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

