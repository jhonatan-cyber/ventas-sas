"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SalesCustomer } from "@prisma/client"

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
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setCi(customer.ruc || "")
      setName(customer.name ? capitalizeWords(customer.name) : "")
      setEmail(customer.email || "")
      setPhone(customer.phone || "")
      setAddress(customer.address ? capitalizeWords(customer.address) : "")
    } else {
      setCi("")
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ruc: ci.trim() ? ci.trim().toUpperCase() : undefined,
        name: name.trim(),
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {customer 
              ? "Modifica los datos del cliente" 
              : "Completa los datos para crear un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">CI</Label>
                <Input
                  id="ci"
                  value={ci}
                  onChange={(e) => setCi(e.target.value.toUpperCase())}
                  placeholder="Documento de identidad"
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
                  placeholder="Nombre del cliente"
                  required
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
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
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || externalLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              className="rounded-full"
              disabled={isLoading || externalLoading || !name.trim()}
            >
              {isLoading || externalLoading ? "Guardando..." : customer ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

