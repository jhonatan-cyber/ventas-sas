"use client"

import { Profile } from "@prisma/client"
import { Shield, Smartphone } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"


interface SecuritySettingsProps {
  profile: Profile
  onUpdate: (data: Partial<Profile>) => Promise<void>
  isLoading: boolean
}

export function SecuritySettings({ profile, onUpdate, isLoading }: SecuritySettingsProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(profile.twoFactorEnabled || false)

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      // Si se está habilitando, necesitamos configurar 2FA primero
      if (enabled && !profile.twoFactorEnabled) {
        toast.info('Redirigiendo a configuración de 2FA...')
        window.location.href = '/administracion/security/2fa/setup'
        return
      }

      // Si se está deshabilitando
      if (!enabled && profile.twoFactorEnabled) {
        const response = await fetch('/api/administracion/2fa/disable', {
          method: 'POST',
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || 'Error al deshabilitar 2FA')
          setTwoFactorEnabled(true) // Revertir cambio
          return
        }

        toast.success('2FA deshabilitado correctamente')
        setTwoFactorEnabled(false)
        await onUpdate({ twoFactorEnabled: false })
      }
    } catch  {
      toast.error('Error al cambiar configuración de 2FA')
      setTwoFactorEnabled(profile.twoFactorEnabled || false) // Revertir cambio
    }
  }

  return (
    <div className="space-y-6">
      {/* Información de la cuenta */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Estado de la Cuenta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.isActive ? 'Cuenta activa' : 'Cuenta inactiva'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Rol</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.isSuperAdmin ? 'Super Administrador' : profile.role || 'Usuario'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Último Acceso</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.lastLoginAt 
                ? new Date(profile.lastLoginAt).toLocaleString('es-BO', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })
                : 'Nunca'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
        {/* Autenticación de dos factores */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <Label htmlFor="2fa" className="font-medium text-gray-900 dark:text-white">
                Autenticación de Dos Factores (2FA)
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Añade una capa adicional de seguridad a tu cuenta
              </p>
            </div>
          </div>
          <Switch
            id="2fa"
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading}
          />
        </div>

        {twoFactorEnabled && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✓ 2FA está habilitado. Tu cuenta está protegida con autenticación de dos factores.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

