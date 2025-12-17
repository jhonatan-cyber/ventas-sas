"use client"
import { Category } from "@prisma/client"
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

interface CategoryFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: Category
    onSave: (data: any) => void
}

export function CategoryFormDialog({ open, onOpenChange, category, onSave }: CategoryFormDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (category) {
            setName(category.name || "")
            setDescription(category.description || "")
        } else {
            setName("")
            setDescription("")
        }
    }, [category, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            return
        }

        setIsLoading(true)
        try {
            await onSave({
                name: name.trim(),
                description: description.trim() || undefined
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
                            {category ? 'Editar Categoría' : 'Nueva Categoría'}
                        </DialogTitle>
                        <DialogDescription>
                            {category
                                ? 'Modifica los datos de la categoría'
                                : 'Completa los datos para crear una nueva categoría'}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    {/* Contenido con scroll */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Nombre <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(capitalizeWords(e.target.value))}
                                placeholder="Ej: Electrónicos, Ropa, Alimentos..."
                                required
                                disabled={isLoading}
                                className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Descripción
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
                                placeholder="Descripción opcional de la categoría..."
                                rows={3}
                                disabled={isLoading}
                                className="rounded-xl bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white resize-none"
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
                            disabled={isLoading || !name.trim()}
                            className="w-full sm:w-auto rounded-full"
                        >
                            {isLoading ? 'Guardando...' : category ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

