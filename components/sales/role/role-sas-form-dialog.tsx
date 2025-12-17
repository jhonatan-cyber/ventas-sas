"use client"

import { RoleSas } from "@prisma/client"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Función para capitalizar cada palabra (primera letra de cada palabra en mayúscula)
const capitalizeWords = (text: string) => {
  // Preservar espacio(s) al final para no bloquear la escritura
  const trailing = /\s+$/.exec(text)?.[0] || ""
  const core = text.replace(/\s+$/, '')
  if (!core) return trailing
  const cap = core
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return cap + trailing
}

// Función para capitalizar solo la primera letra
const capitalizeFirst = (text: string) => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {role ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {role 
                ? "Modifica los datos del rol" 
                : "Completa los datos para crear un nuevo rol"}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(capitalizeWords(e.target.value))}
                placeholder="Ej: Vendedor, Supervisor, Cajero..."
                required
                disabled={isLoading}
                className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(capitalizeFirst(e.target.value))}
                placeholder="Descripción opcional del rol..."
                rows={3}
                disabled={isLoading}
                className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
          
          {/* Footer estático */}
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-full"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              disabled={isLoading || !nombre.trim()}
              className="w-full sm:w-auto rounded-full"
            >
              {isLoading ? "Guardando..." : role ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

