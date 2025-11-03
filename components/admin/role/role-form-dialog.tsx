"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleWithStats
  onSave: (data: { name: string; description: string }) => void
}

export function RoleFormDialog({ open, onOpenChange, role, onSave }: RoleFormDialogProps) {
  const [name, setName] = useState(role?.name || "")
  const [description, setDescription] = useState(role?.description || "")
  const [isLoading, setIsLoading] = useState(false)
  
  // Validar si el formulario es válido
  const isFormValid = name.trim() !== ""

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

  // Resetear el formulario cuando el modal se abre o se cambia el rol
  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description || "")
    } else {
      setName("")
      setDescription("")
    }
  }, [role, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave({ name, description })
      onOpenChange(false)
      // Resetear formulario
      setName("")
      setDescription("")
    } catch (error) {
      console.error("Error al guardar el rol:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {role ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {role ? "Actualiza la información del rol" : "Completa la información para crear un nuevo rol"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Nombre del Rol <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Vendedor"
                  value={name}
                  onChange={(e) => setName(capitalizeWords(e.target.value))}
                  required
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe las funciones y responsabilidades del rol"
                  value={description}
                  onChange={(e) => setDescription(capitalizeWords(e.target.value))}
                  rows={4}
                  className="rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white resize-none"
                />
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
              {isLoading ? "Guardando..." : role ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

