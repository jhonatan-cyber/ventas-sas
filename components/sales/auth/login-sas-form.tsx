"use client";

import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TwoFactorInput } from "@/components/auth/two-factor-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { PostHogClient } from "@/lib/analytics/posthog-client";

interface LoginSasFormProps {
  customerSlug: string;
  organizationName?: string;
  logoUrl?: string | null;
}

export function LoginSasForm({
  customerSlug,
  organizationName,
  logoUrl,
}: LoginSasFormProps) {const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const credentials: any = {
        password,
      };

      // El campo puede contener email o CI
      const inputValue = email.trim();
      if (!inputValue) {
        setError("Correo electrónico o CI requerido");
        setIsLoading(false);
        return;
      }

      // Detectar si es un email (contiene @) o CI
      if (inputValue.includes("@")) {
        credentials.email = inputValue;
      } else {
        credentials.ci = inputValue;
      }

      const response = await fetch(`/api/${customerSlug}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include", // Asegurar que las cookies se incluyan
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Error de autenticación";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.success) {
        // Si requiere 2FA
        if (data.requires2FA && data.tempToken) {
          setRequires2FA(true);
          setTempToken(data.tempToken);
          setIsLoading(false);
          return;
        }

        toast.success("Inicio de sesión exitoso");

        // Tracking de login exitoso
        if (data.user) {
          PostHogClient.identify(data.user.id, {
            email: data.user.email || undefined,
            nombre: data.user.nombre || undefined,
            apellido: data.user.apellido || undefined,
            organizationSlug: customerSlug,
            organizationName: organizationName || undefined,
          });

          PostHogClient.capture("sas_login_success", {
            userId: data.user.id,
            email: data.user.email || undefined,
            organizationSlug: customerSlug,
            organizationName: organizationName || undefined,
            loginMethod: inputValue.includes("@") ? "email" : "ci",
          });
        }

        const redirectUrl = data.redirect || `/${customerSlug}/dashboard`;
        try {
          // Redirección client-side
          router.replace(redirectUrl);
          // Fallback hard navigation
          setTimeout(() => {
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== redirectUrl
            ) {
              window.location.href = redirectUrl;
            }
          }, 100);
        } catch {
          if (typeof window !== "undefined") {
            window.location.href = redirectUrl;
          }
        }

        return;
      }

      // Si llegamos aquí, algo salió mal
      const errorMessage = "Error inesperado";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    } catch {
      setError("Error de conexión");
      toast.error("Error de conexión con el servidor");
      setIsLoading(false);
    }
  };

  const handle2FASuccess = (data: any) => {
    const redirectUrl = data.redirect || `/${customerSlug}/dashboard`;
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 150);
  };

  if (requires2FA && tempToken) {
    return (
      <TwoFactorInput
        endpoint={`/api/${customerSlug}/login/verify-2fa`}
        tempToken={tempToken}
        onSuccess={handle2FASuccess}
        onError={(err) => {
          setError(err);
          toast.error(err);
        }}
      />
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-700">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl shadow-gray-900/10 dark:shadow-black/50 rounded-3xl overflow-hidden relative group">
        {/* Efecto de brillo sutil en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:via-teal-500/5 group-hover:to-cyan-500/5 transition-all duration-500 rounded-3xl pointer-events-none"></div>

        <CardContent className="p-8 relative z-10">
          {/* Logo o Icono de candado centrado con animación */}
          <div className="flex justify-center mb-6">
            {logoUrl && !logoError ? (
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg shadow-gray-900/10 dark:shadow-black/50 hover:shadow-xl transition-all duration-300 transform hover:scale-110 hover:rotate-6 relative group/icon overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={logoUrl}
                  alt={organizationName || "Logo"}
                  className="w-full h-full object-contain p-2 relative z-10 group-hover/icon:scale-110 transition-transform duration-300"
                  onError={() => {
                    // Si el logo falla al cargar, mostrar el icono de candado
                    setLogoError(true);
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-110 hover:rotate-6 relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl opacity-0 group-hover/icon:opacity-100 blur-md transition-opacity duration-300"></div>
                <Lock className="h-8 w-8 text-white relative z-10 group-hover/icon:scale-110 transition-transform duration-300" />
              </div>
            )}
          </div>

          {/* Título y subtítulo */}
          <div className="text-center mb-8">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {organizationName || "Login SAS"}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Correo o CI mejorado */}
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <Label
                htmlFor="correo"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Correo electrónico o CI
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 transition-all duration-300 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 group-focus-within:scale-110 z-10" />
                <Input
                  id="correo"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com o 12345678"
                  className="pl-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20 transition-all hover:border-gray-400 dark:hover:border-gray-600"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Contraseña mejorado */}
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-500 delay-300">
              <Label
                htmlFor="contraseña"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 transition-all duration-300 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 group-focus-within:scale-110 z-10" />
                <Input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="pl-12 pr-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20 transition-all hover:border-gray-400 dark:hover:border-gray-600"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-full p-1"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
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

            {/* Mensaje de error mejorado */}
            {error && (
              <Alert
                variant="destructive"
                className="border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 rounded-xl animate-in slide-in-from-top-2 duration-300"
              >
                <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de envío mejorado */}
            <Button
              type="submit"
              className="w-full rounded-full h-12 text-base font-semibold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-white dark:to-gray-100 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 dark:hover:from-gray-100 dark:hover:to-gray-200 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 dark:hover:shadow-gray-900/50 transition-all duration-300  transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/btn animate-in fade-in slide-in-from-bottom duration-500 delay-400"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <svg
                      className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </Button>

            {/* Enlace Olvidé mi contraseña */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors duration-300 hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Selector de tema */}
            <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <ThemeSelector />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal Olvidé mi contraseña */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              ¿Olvidaste tu contraseña?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </DialogDescription>
          </DialogHeader>

          {forgotPasswordSuccess ? (
            <div className="space-y-4 py-4">
              <Alert className="border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <AlertDescription className="text-sm font-medium text-green-700 dark:text-green-300">
                  Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña. El enlace expirará en 1 hora.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordSuccess(false);
                  setForgotPasswordEmail("");
                  setForgotPasswordError(null);
                }}
                className="w-full rounded-full"
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setForgotPasswordError(null);
                setForgotPasswordLoading(true);

                try {
                  const inputValue = forgotPasswordEmail.trim();
                  if (!inputValue) {
                    setForgotPasswordError("Por favor ingresa tu correo electrónico");
                    setForgotPasswordLoading(false);
                    return;
                  }

                  // Validar que sea un email válido
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(inputValue)) {
                    setForgotPasswordError("Por favor ingresa un correo electrónico válido");
                    setForgotPasswordLoading(false);
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
                    setForgotPasswordError(errorMessage);
                    toast.error(errorMessage);
                    setForgotPasswordLoading(false);
                    return;
                  }

                  if (data.success) {
                    setForgotPasswordSuccess(true);
                    toast.success("Se ha enviado un enlace de recuperación a tu correo electrónico");
                  } else {
                    setForgotPasswordError(data.error || "Error al procesar la solicitud");
                    toast.error(data.error || "Error al procesar la solicitud");
                  }
                  setForgotPasswordLoading(false);
                } catch {
                  setForgotPasswordError("Error de conexión. Por favor intenta nuevamente.");
                  toast.error("Error de conexión");
                  setForgotPasswordLoading(false);
                }
              }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="pl-10 h-11 rounded-full border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                    required
                    disabled={forgotPasswordLoading}
                  />
                </div>
              </div>

              {forgotPasswordError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                    {forgotPasswordError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordError(null);
                  }}
                  className="flex-1 rounded-full"
                  disabled={forgotPasswordLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
