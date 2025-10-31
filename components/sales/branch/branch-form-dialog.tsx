"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Branch } from "@prisma/client"

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch
  onSave: (data: any) => void
}

export function BranchFormDialog({ open, onOpenChange, branch, onSave }: BranchFormDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const capitalizeWords = (text: string) => {
    // Preservar espacio(s) al final para no bloquear la escritura
    const trailing = /\s+$/.exec(text)?.[0] || ""
    const core = text.replace(/\s+$/,'')
    if (!core) return trailing
    const cap = core
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    return cap + trailing
  }

  useEffect(() => {
    if (branch) {
      setName(branch.name || "")
      setEmail(branch.email || "")
      setPhone(branch.phone || "")
      setAddress(branch.address || "")
    } else {
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")
    }
  }, [branch, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {branch ? "Editar Sucursal" : "Nueva Sucursal"}
          </DialogTitle>
          <DialogDescription>
            {branch 
              ? "Modifica los datos de la sucursal" 
              : "Completa los datos para crear una nueva sucursal"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(capitalizeWords(e.target.value))}
                placeholder="Nombre de la sucursal"
                required
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                placeholder="Dirección completa de la sucursal"
                disabled={isLoading}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              disabled={isLoading || !name.trim()}
              className="rounded-full"
            >
              {isLoading ? "Guardando..." : branch ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

