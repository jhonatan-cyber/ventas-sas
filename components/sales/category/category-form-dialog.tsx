"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Category } from "@prisma/client"

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

    // Función para capitalizar palabras
    const capitalizeWords = (str: string) => {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {category ? "Editar Categoría" : "Nueva Categoría"}
                    </DialogTitle>
                    <DialogDescription>
                        {category
                            ? "Modifica los datos de la categoría"
                            : "Completa los datos para crear una nueva categoría"}
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
                                placeholder="Ej: Electrónicos, Ropa, Alimentos..."
                                required
                                disabled={isLoading}
                                className="rounded-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(capitalizeWords(e.target.value))}
                                placeholder="Descripción opcional de la categoría..."
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
                            disabled={isLoading || !name.trim()}
                            className="rounded-full"
                        >
                            {isLoading ? "Guardando..." : category ? "Actualizar" : "Agregar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

