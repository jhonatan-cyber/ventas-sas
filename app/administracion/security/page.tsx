/**
 * Página de configuración de seguridad
 * Permite habilitar/deshabilitar 2FA
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TwoFactorSetup } from "@/components/auth/two-factor-setup"
import { Loader2, Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar estado de 2FA
    // Por ahora asumimos que está deshabilitado, pero puedes agregar un endpoint para verificar
    setIsLoading(false)
  }, [])

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/administracion/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al deshabilitar 2FA')
        toast.error(data.error || 'Error al deshabilitar 2FA')
        setIsLoading(false)
        return
      }

      setTwoFactorEnabled(false)
      setShowDisable(false)
      setPassword("")
      toast.success('2FA deshabilitado exitosamente')
    } catch (err) {
      setError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setTwoFactorEnabled(true)
    setShowSetup(false)
    toast.success('2FA habilitado exitosamente')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración de Seguridad</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona la seguridad de tu cuenta
        </p>
      </div>

      <div className="space-y-6">
        {/* 2FA Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle>Autenticación de Dos Factores (2FA)</CardTitle>
                  <CardDescription>
                    Añade una capa extra de seguridad a tu cuenta
                  </CardDescription>
                </div>
              </div>
              {twoFactorEnabled && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Activo</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : showSetup ? (
              <TwoFactorSetup
                endpoint="/api/administracion/2fa"
                onComplete={handleSetupComplete}
                onCancel={() => setShowSetup(false)}
              />
            ) : showDisable ? (
              <form onSubmit={handleDisable} className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Para deshabilitar 2FA, necesitas confirmar tu contraseña
                  </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                  <Label htmlFor="disablePassword">Contraseña</Label>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deshabilitando...
                      </>
                    ) : (
                      'Deshabilitar 2FA'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDisable(false)
                      setPassword("")
                      setError(null)
                    }}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : twoFactorEnabled ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Tu cuenta está protegida con autenticación de dos factores.
                    Necesitarás ingresar un código de tu app authenticator cada vez que inicies sesión.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisable(true)}
                >
                  Deshabilitar 2FA
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  La autenticación de dos factores añade una capa adicional de seguridad.
                  Necesitarás un app authenticator como Google Authenticator o Authy.
                </p>
                <Button onClick={() => setShowSetup(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Habilitar 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

