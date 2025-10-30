"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { toast } from "sonner"

interface LoginSasFormProps {
  customerSlug: string
}

export function LoginSasForm({ customerSlug }: LoginSasFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginType, setLoginType] = useState<"ci" | "correo">("ci")
  const [ci, setCi] = useState("")
  const [correo, setCorreo] = useState("")
  const [contraseña, setContraseña] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const credentials: any = {
        contraseña
      }

      if (loginType === "ci") {
        if (!ci.trim()) {
          setError("El CI es requerido")
          setIsLoading(false)
          return
        }
        credentials.ci = ci.trim()
      } else {
        if (!correo.trim()) {
          setError("El correo electrónico es requerido")
          setIsLoading(false)
          return
        }
        credentials.correo = correo.trim()
      }

      const response = await fetch(`/api/${customerSlug}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Asegurar que las cookies se incluyan
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión")
        toast.error(data.error || "Error al iniciar sesión")
        setIsLoading(false)
        return
      }

      if (data.success) {
        toast.success("Sesión iniciada correctamente")
        
        // Esperar un momento para asegurar que las cookies se establezcan en el navegador
        // Luego redirigir usando window.location.href para una navegación completa
        setTimeout(() => {
          const redirectUrl = data.redirect || `/${customerSlug}/dashboard`
          window.location.href = redirectUrl
        }, 150)
        
        return
      }

      // Si llegamos aquí, algo salió mal
      setError("Error al iniciar sesión")
      toast.error("Error al iniciar sesión")
      setIsLoading(false)

    } catch (error: any) {
      console.error("Error en login:", error)
      setError("Error de conexión. Por favor, intenta nuevamente.")
      toast.error("Error de conexión")
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de tipo de login */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
            <button
              type="button"
              onClick={() => setLoginType("ci")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === "ci"
                  ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              CI
            </button>
            <button
              type="button"
              onClick={() => setLoginType("correo")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === "correo"
                  ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Correo
            </button>
          </div>

          {/* Campo CI o Correo */}
          {loginType === "ci" ? (
            <div className="space-y-2">
              <Label htmlFor="ci">Cédula de Identidad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="ci"
                  type="text"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Ingresa tu CI"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="contraseña"
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>

          {/* Información adicional */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Por defecto, usa tu CI como contraseña
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

