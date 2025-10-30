"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CashRegister } from "@prisma/client"

interface CashRegisterOpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegister
  onOpen: (openingBalance: number) => void
}

export function CashRegisterOpenDialog({ open, onOpenChange, cashRegister, onOpen }: CashRegisterOpenDialogProps) {
  const [openingBalance, setOpeningBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (cashRegister && open) {
      setOpeningBalance(Number(cashRegister.openingBalance || 0).toString())
    } else if (!cashRegister && open) {
      setOpeningBalance("0")
    }
  }, [cashRegister, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const balance = parseFloat(openingBalance)
    if (isNaN(balance) || balance < 0) {
      return
    }

    setIsLoading(true)
    try {
      await onOpen(balance)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
          <DialogDescription>
            Ingresa el balance inicial para abrir la caja "{cashRegister?.name}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Balance Inicial <span className="text-red-500">*</span></Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Este será el monto con el que se abre la caja
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

