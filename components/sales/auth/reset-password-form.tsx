"use client";

import { Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
;
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSelector } from "@/components/ui/theme-selector";

interface ResetPasswordFormProps {
  customerSlug: string;
  organizationName?: string;
  logoUrl?: string | null;
  token: string;
}

export function ResetPasswordForm({
  customerSlug,
  organizationName,
  logoUrl,
  token,
}: ResetPasswordFormProps) {;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/${customerSlug}/reset-password/validate?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsValid(true);
        } else {
          setError(data.error || "El enlace de recuperación no es válido o ha expirado");
        }
      } catch {
        setError("Error al validar el enlace de recuperación");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [customerSlug, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/${customerSlug}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Error al restablecer la contraseña";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
        toast.success("Contraseña restablecida exitosamente");
        setTimeout(() => {
          router.push(`/${customerSlug}/login`);
        }, 2000);
      } else {
        setError(data.error || "Error al restablecer la contraseña");
        toast.error(data.error || "Error al restablecer la contraseña");
      }
      setIsLoading(false);
    } catch {
      setError("Error de conexión. Por favor intenta nuevamente.");
      toast.error("Error de conexión");
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-right duration-700">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Validando enlace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-right duration-700">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              {logoUrl && !logoError ? (
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
                  <img
                    src={logoUrl}
                    alt={organizationName || "Logo"}
                    className="w-full h-full object-contain p-2"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            <div className="text-center mb-8">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Enlace Inválido
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                El enlace de recuperación no es válido o ha expirado
              </CardDescription>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/${customerSlug}/forgot-password`}>
                  Solicitar nuevo enlace
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-full">
                <Link href={`/${customerSlug}/login`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-right duration-700">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Contraseña Restablecida!
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                Tu contraseña ha sido restablecida exitosamente
              </CardDescription>
            </div>

            <Alert className="border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6">
              <AlertDescription className="text-sm font-medium text-green-700 dark:text-green-300">
                Serás redirigido al inicio de sesión en unos segundos...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-700">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl">
        <CardContent className="p-8">
          {/* Logo o Icono */}
          <div className="flex justify-center mb-6">
            {logoUrl && !logoError ? (
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
                <img
                  src={logoUrl}
                  alt={organizationName || "Logo"}
                  className="w-full h-full object-contain p-2"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Título y subtítulo */}
          <div className="text-center mb-8">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Restablecer Contraseña
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Ingresa tu nueva contraseña
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nueva Contraseña */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Nueva Contraseña
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-12 pr-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Contraseña */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Confirmar Contraseña
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu contraseña"
                  className="pl-12 pr-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              className="w-full rounded-full h-12 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-lg hover:shadow-2xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                "Restablecer Contraseña"
              )}
            </Button>

            {/* Volver al login */}
            <div className="text-center">
              <Link
                href={`/${customerSlug}/login`}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors duration-300 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>

            {/* Selector de tema */}
            <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <ThemeSelector />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

