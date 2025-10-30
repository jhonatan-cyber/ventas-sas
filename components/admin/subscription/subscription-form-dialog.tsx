"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

interface Customer {
  id: string
  razonSocial: string | null
  nit: string | null
  nombre: string | null
  apellido: string | null
  email: string | null
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
  const [customerId, setCustomerId] = useState("")
  const [planId, setPlanId] = useState("")
  const [billingPeriod, setBillingPeriod] = useState("monthly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [autoRenew, setAutoRenew] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCustomers()
      loadPlans()
    }
  }, [open])

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true)
      const response = await fetch('/api/administracion/customers?pageSize=1000')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setCustomersLoading(false)
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
      setCustomerId(subscription.customerId || "")
      setPlanId(subscription.planId || "")
      setBillingPeriod(subscription.billingPeriod || "monthly")
      setStartDate(subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : "")
      setEndDate(subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : "")
      setAutoRenew(subscription.autoRenew ?? true)
    } else {
      setCustomerId("")
      setPlanId("")
      setBillingPeriod("monthly")
      setStartDate("")
      setEndDate("")
      setAutoRenew(true)
    }
  }, [subscription, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data: any = {
        customerId,
        planId,
        billingPeriod,
        autoRenew,
        status: subscription ? subscription.status : 'active', // Solo para edición, creación siempre activo
      }

      if (startDate) {
        data.startDate = startDate
      }
      if (endDate) {
        data.endDate = endDate
      }

      await onSave(data)
      onOpenChange(false)
      
      setCustomerId("")
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
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {subscription ? "Editar Suscripción" : "Nueva Suscripción"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {subscription ? "Actualiza la información de la suscripción" : "Completa la información para crear una nueva suscripción"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer" className="text-gray-700 dark:text-gray-300">
                  Cliente *
                </Label>
                <Select value={customerId} onValueChange={setCustomerId} disabled={customersLoading}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                    <SelectValue placeholder={customersLoading ? "Cargando..." : "Selecciona un cliente"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] min-w-full">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">
                        {customer.razonSocial || `${customer.nombre || ''} ${customer.apellido || ''}`.trim() || customer.email || 'Cliente sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan" className="text-gray-700 dark:text-gray-300">
                  Plan *
                </Label>
                <Select value={planId} onValueChange={setPlanId} disabled={plansLoading}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                    <SelectValue placeholder={plansLoading ? "Cargando..." : "Selecciona un plan"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1a1a] min-w-full">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a] whitespace-normal">
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingPeriod" className="text-gray-700 dark:text-gray-300">
                  Período de Facturación *
                </Label>
                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
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
                  <Label className="text-gray-700 dark:text-gray-300">Renovación Automática</Label>
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
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300">
                  Fecha de Inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-300">
                  Fecha de Fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
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
              disabled={isLoading || !customerId || !planId}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              {isLoading ? "Guardando..." : subscription ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

