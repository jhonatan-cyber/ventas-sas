"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Profile } from "@prisma/client"
import { toast } from "sonner"

interface ProfileFormProps {
  profile: Profile
  onSave: (data: Partial<Profile>) => Promise<void>
  isLoading: boolean
}

export function ProfileForm({ profile, onSave, isLoading }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    ci: profile.ci || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido'
    }

    if (formData.ci && formData.ci.length < 5) {
      newErrors.ci = 'El CI debe tener al menos 5 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    await onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Juan Pérez"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="usuario@ejemplo.com"
          required
        />
        {errors.email && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ci">Cédula de Identidad (CI)</Label>
        <Input
          id="ci"
          value={formData.ci}
          onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
          placeholder="12345678"
        />
        {errors.ci && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.ci}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+591 70000000"
        />
        {errors.phone && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Calle, número, ciudad"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  )
}

