"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TwoFactorInput } from "@/components/auth/two-factor-input"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)

  // Verificar si hay un error en la URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'no_access') {
      setError('No tienes permisos de administrador. Contacta al administrador del sistema para obtener acceso.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/administracion/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error de autenticación")
        setIsLoading(false)
        return
      }

      // Verificar que el login fue exitoso
      if (!data.success) {
        setError(data.error || "Error de autenticación")
        setIsLoading(false)
        return
      }

      // Si requiere 2FA
      if (data.requires2FA && data.tempToken) {
        setRequires2FA(true)
        setTempToken(data.tempToken)
        setIsLoading(false)
        return
      }

      // Login exitoso - precargar permisos antes de redirigir
      const target = data.redirect || '/administracion/dashboard'
      console.log('Login exitoso, precargando permisos...')
      
      // Precargar permisos para que estén disponibles inmediatamente
      try {
        const permissionsResponse = await fetch('/api/administracion/auth/permissions', {
          credentials: 'include',
        })
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          // Guardar en sessionStorage para que el contexto los cargue inmediatamente
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('admin-permissions-cache', JSON.stringify({
              permissions: permissionsData.permissions || [],
              isSuperAdmin: permissionsData.isSuperAdmin || false,
              timestamp: Date.now(),
            }))
            sessionStorage.setItem('admin-permissions-cache-timestamp', Date.now().toString())
          }
        }
      } catch (error) {
        console.error('Error precargando permisos:', error)
      }
      
      // Redirigir usando router primero, luego usar window.location como fallback
      // La cookie ya está establecida por el servidor
      try {
        router.push(target)
        // Fallback: si router.push no funciona, usar window.location después de un pequeño delay
        setTimeout(() => {
          if (window.location.pathname === '/administracion/login') {
            window.location.href = target
          }
        }, 100)
      } catch (error) {
        // Si hay error con router, usar window.location directamente
        window.location.href = target
      }
    } catch (error: unknown) {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FASuccess = async (data: any) => {
    const target = data.redirect || '/administracion/dashboard'
    
    // Precargar permisos antes de redirigir
    try {
      const permissionsResponse = await fetch('/api/administracion/auth/permissions', {
        credentials: 'include',
      })
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin-permissions-cache', JSON.stringify({
            permissions: permissionsData.permissions || [],
            isSuperAdmin: permissionsData.isSuperAdmin || false,
            timestamp: Date.now(),
          }))
          sessionStorage.setItem('admin-permissions-cache-timestamp', Date.now().toString())
        }
      }
    } catch (error) {
      console.error('Error precargando permisos:', error)
    }
    
    try { router.replace(target) } catch {}
    setTimeout(() => { window.location.replace(target) }, 50)
  }

  if (requires2FA && tempToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="w-full max-w-md p-4">
          <TwoFactorInput
            endpoint="/api/administracion/login/verify-2fa"
            tempToken={tempToken}
            onSuccess={handle2FASuccess}
            onError={(err) => setError(err)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sistema de Administración</CardTitle>
            <CardDescription className="text-center">Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@saleshub.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

