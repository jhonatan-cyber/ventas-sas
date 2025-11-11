/**
 * Componente para configurar 2FA
 * Muestra QR code y permite verificar código
 */

"use client"

import { Loader2, CheckCircle2, AlertCircle, Shield, Download } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TwoFactorSetupProps {
  endpoint: string // '/api/administracion/2fa' o '/api/[slug]/2fa'
  onComplete?: () => void
  onCancel?: () => void
}

export function TwoFactorSetup({ endpoint, onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${endpoint}/setup`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar configuración')
        toast.error(data.error || 'Error al iniciar configuración')
        setIsLoading(false)
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes || [])
      setStep('verify')
      setShowBackupCodes(true)
      toast.success('Escanea el QR code con tu app authenticator')
    } catch  {
      setError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!code || code.length !== 6) {
      setError('Ingresa un código de 6 dígitos')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${endpoint}/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código inválido')
        toast.error(data.error || 'Código inválido')
        setIsLoading(false)
        return
      }

      toast.success('2FA habilitado exitosamente')
      if (onComplete) onComplete()
    } catch  {
      setError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([`Códigos de respaldo 2FA\n\n${codesText}\n\nGuarda estos códigos en un lugar seguro.`], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes-2fa.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Configurar Autenticación de Dos Factores</CardTitle>
          </div>
          <CardDescription>
            Añade una capa extra de seguridad a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Necesitarás una app authenticator como Google Authenticator, Authy o Microsoft Authenticator
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Al habilitar 2FA, necesitarás ingresar un código de 6 dígitos además de tu contraseña al iniciar sesión.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSetup}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  'Iniciar Configuración'
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Código 2FA</CardTitle>
        <CardDescription>
          Escanea el QR code y luego ingresa el código
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <Image
                  src={qrCode}
                  alt="QR Code 2FA"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              </div>
              {secret && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    O ingresa manualmente este código:
                  </p>
                  <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                    {secret}
                  </code>
                </div>
              )}
            </div>
          )}

          {showBackupCodes && backupCodes.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Guarda estos códigos de respaldo:</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, idx) => (
                      <code key={idx} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {code}
                      </code>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                    className="mt-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar códigos
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Estos códigos solo se mostrarán una vez. Guárdalos en un lugar seguro.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerify}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código de 6 dígitos</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setCode(value)
                    setError(null)
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Ingresa el código que muestra tu app authenticator
                </p>
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
                  disabled={isLoading || code.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verificar y Habilitar
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('setup')}
                  disabled={isLoading}
                >
                  Atrás
                </Button>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

