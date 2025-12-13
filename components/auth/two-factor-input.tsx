/**
 * Componente para ingresar código 2FA durante login
 */

"use client"

import { Loader2, Shield, AlertCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    } catch  {
      const errorMsg = 'Error de conexión'
      setError(errorMsg)
      toast.error(errorMsg)
      if (onError) onError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Logo/Brand Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          SmartPOS 2FA
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Autenticación de Dos Factores
        </p>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl text-center font-semibold text-gray-900 dark:text-white">
            Código de Verificación
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Ingresa el código de tu aplicación authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                También puedes usar un código de respaldo si no tienes acceso a tu app authenticator
              </AlertDescription>
            </Alert>

            {/* Code Input */}
            <div className="space-y-3">
              <Label htmlFor="twoFactorCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Código de autenticación
              </Label>
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
                className="text-center text-3xl tracking-[0.5em] font-mono h-16 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 rounded-lg"
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Código de 6 dígitos de tu app authenticator o código de respaldo de 8 dígitos
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || (code.length !== 6 && code.length !== 8)}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Verificando código...
                </div>
              ) : (
                'Verificar Código'
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ¿Problemas con el código? Usa un código de respaldo o contacta al administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

