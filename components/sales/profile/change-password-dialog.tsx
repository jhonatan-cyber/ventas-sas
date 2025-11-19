"use client"

import { Lock, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerSlug: string
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  customerSlug,
}: ChangePasswordDialogProps) {
  const t = useTranslations()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('profile.security.passwordFields.allFieldsRequired') || "Todos los campos son requeridos")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      toast.error(t('profile.security.passwordFields.minLength') || "La nueva contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('profile.security.passwordFields.noMatch') || "Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      toast.error(t('profile.security.passwordFields.samePassword') || "La nueva contraseña debe ser diferente a la actual")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/${customerSlug}/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || t('profile.security.passwordFields.error') || 'Error al cambiar la contraseña')
        return
      }

      toast.success(t('profile.security.passwordFields.success') || 'Contraseña actualizada correctamente')
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onOpenChange(false)
    } catch {
      toast.error(t('profile.security.passwordFields.error') || 'Error al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('profile.security.changePassword') || 'Cambiar Contraseña'}
          </DialogTitle>
          <DialogDescription>
            {t('profile.security.passwordFields.description') || 'Ingresa tu contraseña actual y la nueva contraseña'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('profile.security.passwordFields.current') || 'Contraseña Actual'}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                className="rounded-full pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 rounded-full"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('profile.security.passwordFields.new') || 'Nueva Contraseña'}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                className="rounded-full pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 rounded-full"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {t('profile.security.passwordFields.minLengthHint') || 'Mínimo 8 caracteres'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('profile.security.passwordFields.confirm') || 'Confirmar Nueva Contraseña'}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="rounded-full pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 rounded-full"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4 justify-center">
            <Button type="submit" disabled={isLoading} className="rounded-full">
              {isLoading ? (t('message.saving') || 'Actualizando...') : (t('action.update') || 'Actualizar')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('action.cancel') || 'Cancelar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

