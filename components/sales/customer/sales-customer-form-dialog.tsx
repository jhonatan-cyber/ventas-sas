"use client"

import { SalesCustomer } from "@prisma/client"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SalesCustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: SalesCustomer
  onSave: (data: any) => void
  isLoading?: boolean
}

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

export function SalesCustomerFormDialog({ open, onOpenChange, customer, onSave, isLoading: externalLoading = false }: SalesCustomerFormDialogProps) {
  const [ci, setCi] = useState("")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setCi(customer.ruc || "")
      setName(customer.name ? capitalizeWords(customer.name) : "")
      setLastName(customer.lastName ? capitalizeWords(customer.lastName) : "")
      setEmail(customer.email || "")
      setPhone(customer.phone || "")
      setAddress(customer.address ? capitalizeWords(customer.address) : "")
    } else {
      setCi("")
      setName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setAddress("")
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !lastName.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ruc: ci.trim() ? ci.trim().toUpperCase() : undefined,
        name: name.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {customer 
                ? 'Modifica la información del cliente seleccionado.' 
                : 'Completa los datos para registrar un nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">RUC/CI</Label>
                <Input
                  id="ci"
                  value={ci}
                  onChange={(e) => setCi(e.target.value.toUpperCase())}
                  placeholder="Ingresa RUC o CI"
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(capitalizeWords(e.target.value))}
                  placeholder="Nombre"
                  required
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeWords(e.target.value))}
                  placeholder="Apellido"
                  required
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono"
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(capitalizeWords(e.target.value))}
                  placeholder="Dirección completa"
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
          
          {/* Footer estático */}
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || externalLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              className="w-full sm:w-auto rounded-full"
              disabled={isLoading || externalLoading || !name.trim() || !lastName.trim()}
            >
              {isLoading || externalLoading ? 'Guardando...' : customer ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

