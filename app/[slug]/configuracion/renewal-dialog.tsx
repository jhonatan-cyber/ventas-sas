"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface RenewalDialogProps {
  customerSlug: string
  initialAmount?: string
}

export function RenewalDialog({ customerSlug, initialAmount = "" }: RenewalDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(initialAmount)
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("amount", amount)
      formData.append("description", description)
      if (file) formData.append("receipt", file)

      // Aquí podrías enviar a tu endpoint si lo deseas
      // await fetch(`/api/${customerSlug}/subscriptions/renewal`, { method: 'POST', body: formData })

      toast.success("Solicitud de renovación enviada")
      setOpen(false)
      setAmount(initialAmount || "")
      setDescription("")
      setFile(null)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo enviar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-full">Renovar</Button>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setAmount(initialAmount || "")
          setDescription("")
          setFile(null)
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitud de renovación</DialogTitle>
            <DialogDescription>
              Completa los datos para solicitar la renovación de tu plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Ej: 99.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Detalle de la renovación (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt">Comprobante</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


