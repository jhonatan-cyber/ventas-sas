"use client";

import { Shield, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

import type React from "react";

import { TwoFactorInput } from "@/components/auth/two-factor-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Verificar si hay un error en la URL
  useEffect(() => {
    const errorParam = searchParams.get("Error");
    if (errorParam === "no_access") {
      setError(
        "No tienes permisos de administrador. Contacta al administrador del sistema para obtener acceso."
      );
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/administracion/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error de autenticación");
        setIsLoading(false);
        return;
      }

      // Verificar que el login fue exitoso
      if (!data.success) {
        setError(data.error || "Error de autenticación");
        setIsLoading(false);
        return;
      }

      // Si requiere 2FA
      if (data.requires2FA && data.tempToken) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        setIsLoading(false);
        return;
      }

      // Login exitoso - precargar permisos antes de redirigir
      const target = data.redirect || "/administracion/dashboard";
      console.log("Login exitoso, precargando permisos...");

      // Precargar permisos para que estén disponibles inmediatamente
      try {
        const permissionsResponse = await fetch(
          "/api/administracion/auth/permissions",
          {
            credentials: "include",
          }
        );
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          // Guardar en sessionStorage para que el contexto los cargue inmediatamente
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "admin-permissions-cache",
              JSON.stringify({
                permissions: permissionsData.permissions || [],
                isSuperAdmin: permissionsData.isSuperAdmin || false,
                timestamp: Date.now(),
              })
            );
            sessionStorage.setItem(
              "admin-permissions-cache-timestamp",
              Date.now().toString()
            );
          }
        }
      } catch (error) {
        console.error("Error precargando permisos:", error);
      }

      // Redirigir usando router primero, luego usar window.location como fallback
      // La cookie ya está establecida por el servidor
      try {
        router.push(target);
        // Fallback: si router.push no funciona, usar window.location después de un pequeño delay
        setTimeout(() => {
          if (window.location.pathname === "/administracion/login") {
            window.location.href = target;
          }
        }, 100);
      } catch {
        // Si hay error con router, usar window.location directamente
        window.location.href = target;
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = async (data: any) => {
    const target = data.redirect || "/administracion/dashboard";

    // Precargar permisos antes de redirigir
    try {
      const permissionsResponse = await fetch(
        "/api/administracion/auth/permissions",
        {
          credentials: "include",
        }
      );
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "admin-permissions-cache",
            JSON.stringify({
              permissions: permissionsData.permissions || [],
              isSuperAdmin: permissionsData.isSuperAdmin || false,
              timestamp: Date.now(),
            })
          );
          sessionStorage.setItem(
            "admin-permissions-cache-timestamp",
            Date.now().toString()
          );
        }
      }
    } catch (error) {
      console.error("Error precargando permisos:", error);
    }

    try {
      router.replace(target);
    } catch {}
    setTimeout(() => {
      window.location.replace(target);
    }, 50);
  };

  if (requires2FA && tempToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <TwoFactorInput
            endpoint="/api/administracion/login/verify-2fa"
            tempToken={tempToken}
            onSuccess={handle2FASuccess}
            onError={(err) => setError(err)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            SmartPOS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de Administración
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-semibold text-gray-900 dark:text-white">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email/CI Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email o Cédula de Identidad
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {email.includes('@') ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin@smartpos.com o 12345678"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Puedes usar tu email o número de cédula
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {!email.includes('@') && email && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Si usas tu CI, la contraseña es el mismo número
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Problemas para acceder? Contacta al administrador del sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 SmartPOS. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                SmartPOS
              </h1>
            </div>
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center font-semibold text-gray-900 dark:text-white">
                  Cargando...
                </CardTitle>
                <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                  Preparando el sistema de administración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <AdminLoginFormContent />
    </Suspense>
  );
}
