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

const DEFAULT_PHONE_PREFIX = "+591"
const DEFAULT_PHONE_PREFIX_DIGITS = DEFAULT_PHONE_PREFIX.replace(/\D/g, '')

const normalizePhoneForState = (value?: string | null) => {
  if (!value) return DEFAULT_PHONE_PREFIX
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_PHONE_PREFIX
  const digitsOnly = trimmed.replace(/\D/g, '')
  const localDigits = digitsOnly.startsWith(DEFAULT_PHONE_PREFIX_DIGITS)
    ? digitsOnly.slice(DEFAULT_PHONE_PREFIX_DIGITS.length)
    : digitsOnly
  if (!localDigits) return DEFAULT_PHONE_PREFIX
  return `${DEFAULT_PHONE_PREFIX}${localDigits}`
}

const sanitizePhoneForSubmit = (value: string) => {
  const sanitized = normalizePhoneForState(value)
  const digits = sanitized.replace(/\D/g, '')
  if (digits.length <= DEFAULT_PHONE_PREFIX_DIGITS.length) {
    return undefined
  }
  return sanitized
}

export function SalesCustomerFormDialog({ open, onOpenChange, customer, onSave, isLoading: externalLoading = false }: SalesCustomerFormDialogProps) {
  const [ci, setCi] = useState("")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    const localDigits = digitsOnly.startsWith(DEFAULT_PHONE_PREFIX_DIGITS)
      ? digitsOnly.slice(DEFAULT_PHONE_PREFIX_DIGITS.length)
      : digitsOnly
    setPhone(localDigits ? `${DEFAULT_PHONE_PREFIX}${localDigits}` : DEFAULT_PHONE_PREFIX)
  }

  const handlePhoneBlur = () => {
    setPhone((prev) => {
      if (!prev || prev === '+' || prev === DEFAULT_PHONE_PREFIX) return DEFAULT_PHONE_PREFIX
      const normalized = normalizePhoneForState(prev)
      const digitsOnly = normalized.replace(/\D/g, '')
      if (!digitsOnly || digitsOnly.length <= DEFAULT_PHONE_PREFIX_DIGITS.length) {
        return DEFAULT_PHONE_PREFIX
      }
      return normalized
    })
  }

  useEffect(() => {
    if (customer) {
      setCi(customer.ruc || "")
      setName(customer.name ? capitalizeWords(customer.name) : "")
      setLastName(customer.lastName ? capitalizeWords(customer.lastName) : "")
      setEmail(customer.email || "")
      setPhone(normalizePhoneForState(customer.phone))
      setAddress(customer.address ? capitalizeWords(customer.address) : "")
    } else {
      setCi("")
      setName("")
      setLastName("")
      setEmail("")
      setPhone(DEFAULT_PHONE_PREFIX)
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
      const normalizedPhone = sanitizePhoneForSubmit(phone)
      await onSave({
        ruc: ci.trim() ? ci.trim().toUpperCase() : undefined,
        name: name.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: normalizedPhone,
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
                  placeholder="Nombre"
                  required
                  disabled={isLoading || externalLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeWords(e.target.value))}
                  placeholder="Apellido"
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
                <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
                  <Input
                    value={DEFAULT_PHONE_PREFIX}
                    readOnly
                    aria-hidden="true"
                    className="rounded-full text-center font-semibold"
                  />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone.replace(/[^0-9]/g, '').replace(new RegExp(`^${DEFAULT_PHONE_PREFIX_DIGITS}`), '')}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="70000000"
                    inputMode="numeric"
                    disabled={isLoading || externalLoading}
                    className="rounded-full"
                  />
                </div>
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

