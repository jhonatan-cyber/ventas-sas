/**
 * Componente para ingresar código 2FA durante login
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface TwoFactorInputProps {
  endpoint: string // '/api/administracion/login/verify-2fa' o '/api/[slug]/login/verify-2fa'
  tempToken: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function TwoFactorInput({ endpoint, tempToken, onSuccess, onError }: TwoFactorInputProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!code || (code.length !== 6 && code.length !== 8)) {
      setError('El código debe tener 6 u 8 dígitos')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, tempToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Código inválido'
        setError(errorMsg)
        toast.error(errorMsg)
        if (onError) onError(errorMsg)
        setIsLoading(false)
        return
      }

      toast.success('Autenticación exitosa')
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const errorMsg = 'Error de conexión'
      setError(errorMsg)
      toast.error(errorMsg)
      if (onError) onError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <CardTitle>Autenticación de Dos Factores</CardTitle>
        </div>
        <CardDescription>
          Ingresa el código de tu app authenticator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                También puedes usar un código de respaldo si no tienes acceso a tu app authenticator
              </AlertDescription>
            </Alert>

            <div className="grid gap-2">
              <Label htmlFor="twoFactorCode">Código de autenticación</Label>
              <Input
                id="twoFactorCode"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setCode(value)
                  setError(null)
                }}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Ingresa el código de 6 dígitos de tu app authenticator o un código de respaldo de 8 dígitos
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || (code.length !== 6 && code.length !== 8)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

