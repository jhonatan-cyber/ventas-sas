"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Customer } from "@/lib/types"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSave: (data: any) => void
}

// Función para capitalizar texto
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSave }: CustomerFormDialogProps) {
  const [razonSocial, setRazonSocial] = useState("")
  const [nit, setNit] = useState("")
  const [ci, setCi] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setRazonSocial(customer.razonSocial || "")
      setNit(customer.nit || "")
      setCi(customer.ci || "")
      setNombre(customer.nombre || "")
      setApellido(customer.apellido || "")
      setDireccion(customer.direccion || "")
      setTelefono(customer.telefono || "")
      setEmail(customer.email || "")
    } else {
      setRazonSocial("")
      setNit("")
      setCi("")
      setNombre("")
      setApellido("")
      setDireccion("")
      setTelefono("")
      setEmail("")
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const customerData = {
      razonSocial,
      nit,
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      email,
    }

    onSave(customerData)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {customer ? "Actualiza la información del cliente" : "Completa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Razón Social */}
            <div className="grid gap-2">
              <Label htmlFor="razonSocial" className="text-gray-700 dark:text-gray-300">
                Razón Social
              </Label>
              <Input
                id="razonSocial"
                placeholder="Nombre de la empresa"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* NIT */}
            <div className="grid gap-2">
              <Label htmlFor="nit" className="text-gray-700 dark:text-gray-300">
                NIT
              </Label>
              <Input
                id="nit"
                placeholder="12345678-9"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* CI */}
            <div className="grid gap-2">
              <Label htmlFor="ci" className="text-gray-700 dark:text-gray-300">
                CI (Cédula de Identidad) *
              </Label>
              <Input
                id="ci"
                placeholder="1234567"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                required
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* Nombre y Apellido en una fila */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre" className="text-gray-700 dark:text-gray-300">
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  placeholder="Juan"
                  value={nombre}
                  onChange={(e) => setNombre(capitalizeText(e.target.value))}
                  required
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apellido" className="text-gray-700 dark:text-gray-300">
                  Apellido *
                </Label>
                <Input
                  id="apellido"
                  placeholder="Pérez"
                  value={apellido}
                  onChange={(e) => setApellido(capitalizeText(e.target.value))}
                  required
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="grid gap-2">
              <Label htmlFor="direccion" className="text-gray-700 dark:text-gray-300">
                Dirección
              </Label>
              <Input
                id="direccion"
                placeholder="Calle Principal 123"
                value={direccion}
                onChange={(e) => setDireccion(capitalizeText(e.target.value))}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* Teléfono y Email en una fila */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefono" className="text-gray-700 dark:text-gray-300">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  placeholder="+591 12345678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full px-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-8"
            >
              {isLoading ? "Guardando..." : customer ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

