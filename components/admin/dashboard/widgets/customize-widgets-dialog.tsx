"use client"

import { useState } from "react"

import { Widget, DEFAULT_WIDGETS } from "./types"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"


interface CustomizeWidgetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgets: Widget[]
  onSave: (widgets: Widget[]) => void
}

export function CustomizeWidgetsDialog({
  open,
  onOpenChange,
  widgets,
  onSave,
}: CustomizeWidgetsDialogProps) {
  const [localWidgets, setLocalWidgets] = useState<Widget[]>(widgets)

  const handleToggle = (id: string) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    )
  }

  const handleSave = () => {
    onSave(localWidgets)
    onOpenChange(false)
  }

  const handleReset = () => {
    setLocalWidgets(DEFAULT_WIDGETS)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Widgets</DialogTitle>
          <DialogDescription>
            Selecciona qué widgets mostrar en tu dashboard. Puedes reorganizarlos
            arrastrando y soltando después.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto py-4">
          {localWidgets.map((widget) => (
            <div
              key={widget.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
            >
              <Checkbox
                id={widget.id}
                checked={widget.enabled}
                onCheckedChange={() => handleToggle(widget.id)}
              />
              <Label
                htmlFor={widget.id}
                className="flex-1 cursor-pointer text-sm font-medium"
              >
                {widget.title}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Restaurar por defecto
          </Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
