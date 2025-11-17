"use client"

import { useState, useEffect } from "react"

import type { CashRegisterWithRelations } from "./types"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CashRegisterOpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegisterWithRelations
  onOpen: (openingBalance: number) => void
}

export function CashRegisterOpenDialog({ open, onOpenChange, cashRegister, onOpen }: CashRegisterOpenDialogProps) {
  const [openingBalance, setOpeningBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (cashRegister && open) {
      const balance = cashRegister.openingBalance && typeof cashRegister.openingBalance === 'object' && 'toNumber' in cashRegister.openingBalance
        ? cashRegister.openingBalance.toNumber()
        : Number(cashRegister.openingBalance || 0)
      setOpeningBalance(balance.toString())
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
      <DialogContent className="sm:max-w-[500px] lg:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Abrir Caja</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Ingresa el balance inicial para abrir la caja "{cashRegister?.name}"
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
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
                className="rounded-full"
              />
              <p className="text-xs text-gray-500">
                Este será el monto con el que se abre la caja
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              className="rounded-full w-full sm:w-auto"
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

