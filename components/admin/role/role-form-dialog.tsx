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
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {role ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {role ? "Actualiza la información del rol" : "Completa la información para crear un nuevo rol"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                Nombre del Rol
              </Label>
              <Input
                id="name"
                placeholder="Ej: Vendedor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe las funciones y responsabilidades del rol"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
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
              disabled={isLoading || !name.trim()}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              {isLoading ? "Guardando..." : role ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

