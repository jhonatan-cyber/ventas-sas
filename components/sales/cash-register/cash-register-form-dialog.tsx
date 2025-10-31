"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CashRegister } from "@prisma/client"

interface CashRegisterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegister & { branch?: any }
  customerSlug: string
  onSave: (data: any) => void
}

export function CashRegisterFormDialog({ open, onOpenChange, cashRegister, customerSlug, onSave }: CashRegisterFormDialogProps) {
  const [name, setName] = useState("")
  const [branchId, setBranchId] = useState("none")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [branches, setBranches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const capitalizeWords = (value: string) =>
    value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())

  // Cargar sucursales
  useEffect(() => {
    if (open) {
      loadBranches()
    }
  }, [open, customerSlug])

  // Cargar datos de la caja si existe
  useEffect(() => {
    if (cashRegister && open) {
      setName(cashRegister.name ? capitalizeWords(cashRegister.name) : "")
      setBranchId(cashRegister.branchId || "none")
      setOpeningBalance(Number(cashRegister.openingBalance).toString())
    } else if (!cashRegister && open) {
      setName("")
      setBranchId("none")
      setOpeningBalance("0")
    }
  }, [cashRegister, open])

  const loadBranches = async () => {
    try {
      setIsLoadingData(true)
      const response = await fetch(`/api/${customerSlug}/sucursales`)
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: name.trim(),
        branchId: branchId !== "none" ? branchId : undefined,
        openingBalance: parseFloat(openingBalance) || 0
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
            {cashRegister ? "Editar Caja" : "Nueva Caja"}
          </DialogTitle>
          <DialogDescription>
            {cashRegister 
              ? "Modifica los datos de la caja" 
              : "Completa los datos para crear una nueva caja registradora"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(capitalizeWords(e.target.value))}
                placeholder="Nombre de la caja"
                required
                disabled={isLoading || isLoadingData}
                className="rounded-full"
              />
            </div>

            {/* Sucursal */}
            <div className="space-y-2">
              <Label htmlFor="branchId">Sucursal</Label>
              <Select value={branchId} onValueChange={setBranchId} disabled={isLoading || isLoadingData}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Seleccionar sucursal (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sucursal</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance inicial (solo si es nueva caja) */}
            {!cashRegister && (
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Balance Inicial</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="rounded-full"
                />
                <p className="text-xs text-gray-500">
                  Este será el balance inicial cuando la caja se abra por primera vez
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              className="rounded-full"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Guardando..." : cashRegister ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

