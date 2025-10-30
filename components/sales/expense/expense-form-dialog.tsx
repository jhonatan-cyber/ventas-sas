"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Expense } from "@prisma/client"
import { toast } from "sonner"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
  organizationId: string
  onSave: (data: any) => void
}

const CATEGORIES = [
  "Servicios",
  "Insumos",
  "Transporte",
  "Salarios",
  "Alquiler",
  "Servicios Públicos",
  "Marketing",
  "Mantenimiento",
  "Otros"
]

export function ExpenseFormDialog({ open, onOpenChange, expense, organizationId, onSave }: ExpenseFormDialogProps) {
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [userId, setUserId] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Cargar usuarios
  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open, organizationId])

  // Cargar datos del gasto si existe
  useEffect(() => {
    if (expense && open) {
      setCategory(expense.category || "")
      setDescription(expense.description || "")
      setAmount(Number(expense.amount).toString())
      setDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : "")
      setUserId(expense.userId || "")
    } else if (!expense && open) {
      const today = new Date().toISOString().split('T')[0]
      setCategory("")
      setDescription("")
      setAmount("")
      setDate(today)
      setUserId("")
    }
  }, [expense, open])

  const loadUsers = async () => {
    try {
      setIsLoadingData(true)
      // Intentar cargar SalesUsers primero (son los requeridos para gastos)
      let response = await fetch(`/api/${organizationId}/sales-users`)
      let usersData: any[] = []
      
      if (response.ok) {
        const data = await response.json()
        usersData = data.users || []
      }

      // Si no hay SalesUsers, cargar UsuarioSas y el servicio los convertirá automáticamente
      if (usersData.length === 0) {
        response = await fetch(`/api/${organizationId}/usuarios?pageSize=100&status=active`)
        if (response.ok) {
          const data = await response.json()
          const usuarios = data.usuarios || []
          // Mapear usuarios SAS - el servicio los convertirá a SalesUser automáticamente
          usersData = usuarios.map((user: any) => ({
            id: user.id,
            fullName: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.correo
          }))
        }
      } else {
        // Mapear SalesUsers al formato esperado
        usersData = usersData.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email
        }))
      }

      setUsers(usersData)
      if (!expense && usersData.length > 0) {
        setUserId(usersData[0].id)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      toast.error("Error al cargar usuarios")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category.trim()) {
      toast.error("La categoría es requerida")
      return
    }

    if (!description.trim()) {
      toast.error("La descripción es requerida")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    if (!userId) {
      toast.error("Debe seleccionar un usuario")
      return
    }

    if (!date) {
      toast.error("La fecha es requerida")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        category: category.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        userId
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
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
          </DialogTitle>
          <DialogDescription>
            {expense 
              ? "Modifica los datos del gasto" 
              : "Completa los datos para registrar un nuevo gasto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isLoading || isLoadingData}
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={setCategory} disabled={isLoading || isLoadingData}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el gasto..."
                required
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Monto y Usuario */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">Usuario <span className="text-red-500">*</span></Label>
                <Select value={userId} onValueChange={setUserId} disabled={isLoading || isLoadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName || user.email || 'Usuario'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              disabled={isLoading || !category || !description || !amount || !userId || !date}
            >
              {isLoading ? "Guardando..." : expense ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

