"use client";

import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
;
import { useState } from "react";
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

interface ForgotPasswordFormProps {
  customerSlug: string;
  organizationName?: string;
  logoUrl?: string | null;
}

export function ForgotPasswordForm({
  customerSlug,
  organizationName,
  logoUrl,
}: ForgotPasswordFormProps) {;
  const _router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const inputValue = email.trim();
      if (!inputValue) {
        setError("Por favor ingresa tu correo electrónico o CI");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/${customerSlug}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inputValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Error al procesar la solicitud";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
        toast.success("Se ha enviado un enlace de recuperación a tu correo electrónico");
      } else {
        setError(data.error || "Error al procesar la solicitud");
        toast.error(data.error || "Error al procesar la solicitud");
      }
      setIsLoading(false);
    } catch {
      setError("Error de conexión. Por favor intenta nuevamente.");
      toast.error("Error de conexión");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-right duration-700">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl shadow-gray-900/10 dark:shadow-black/50 rounded-3xl overflow-hidden relative">
          <CardContent className="p-8 relative z-10">
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
                  <Mail className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            <div className="text-center mb-8">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Correo Enviado
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                Hemos enviado un enlace de recuperación a tu correo electrónico
              </CardDescription>
            </div>

            <Alert className="border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6">
              <AlertDescription className="text-sm font-medium text-green-700 dark:text-green-300">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                El enlace expirará en 1 hora.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full"
              >
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

  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-700">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl shadow-gray-900/10 dark:shadow-black/50 rounded-3xl overflow-hidden relative group">
        <CardContent className="p-8 relative z-10">
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
                <Mail className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Título y subtítulo */}
          <div className="text-center mb-8">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¿Olvidaste tu contraseña?
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Ingresa tu correo electrónico o CI y te enviaremos un enlace para restablecer tu contraseña
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Correo o CI */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Correo electrónico o CI
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com o CI"
                  className="pl-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <Alert
                variant="destructive"
                className="border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 rounded-xl"
              >
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
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
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

