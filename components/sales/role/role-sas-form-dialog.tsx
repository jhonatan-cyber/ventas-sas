"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RoleSas } from "@prisma/client"

interface RoleSasFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleSas & { customer?: any; sucursal?: any }
  onSave: (data: any) => void
}

export function RoleSasFormDialog({ open, onOpenChange, role, onSave }: RoleSasFormDialogProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (role) {
      setNombre(role.nombre || "")
      setDescripcion(role.descripcion || "")
    } else {
      setNombre("")
      setDescripcion("")
    }
  }, [role, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {role ? "Editar Rol" : "Nuevo Rol"}
          </DialogTitle>
          <DialogDescription>
            {role 
              ? "Modifica los datos del rol" 
              : "Completa los datos para crear un nuevo rol"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Vendedor, Supervisor, Cajero..."
                required
                disabled={isLoading}
                className="rounded-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional del rol..."
                rows={3}
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
              disabled={isLoading || !nombre.trim()}
              className="rounded-full"
            >
              {isLoading ? "Guardando..." : role ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

