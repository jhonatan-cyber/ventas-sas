"use client"

import { Settings } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface KPICustomizerProps {
  kpis: Array<{ id: string; name: string }>
  selectedKPIs: string[]
  onKPIsChange: (selected: string[]) => void
}

export function KPICustomizer({ kpis, selectedKPIs, onKPIsChange }: KPICustomizerProps) {
  const [open, setOpen] = useState(false)
  const [tempSelected, setTempSelected] = useState(selectedKPIs)

  const handleToggle = (kpiId: string) => {
    if (tempSelected.includes(kpiId)) {
      setTempSelected(tempSelected.filter(id => id !== kpiId))
    } else {
      setTempSelected([...tempSelected, kpiId])
    }
  }

  const handleSave = () => {
    if (tempSelected.length > 0) {
      onKPIsChange(tempSelected)
      setOpen(false)
    }
  }

  const handleCancel = () => {
    setTempSelected(selectedKPIs)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Settings className="h-4 w-4 mr-2" />
          Personalizar KPIs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar KPIs</DialogTitle>
          <DialogDescription>
            Selecciona los KPIs que deseas mostrar en el dashboard. Debes seleccionar al menos uno.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="flex items-center space-x-2">
              <Checkbox
                id={kpi.id}
                checked={tempSelected.includes(kpi.id)}
                onCheckedChange={() => handleToggle(kpi.id)}
              />
              <Label
                htmlFor={kpi.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {kpi.name}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} className="rounded-full">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={tempSelected.length === 0}
            className="rounded-full"
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

