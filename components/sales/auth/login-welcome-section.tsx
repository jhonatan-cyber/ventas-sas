"use client";

import { Shield, Activity, BarChart3, Users } from "lucide-react";
interface LoginWelcomeSectionProps {
  organizationName: string;
}

export function LoginWelcomeSection({
  organizationName: _organizationName,
}: LoginWelcomeSectionProps) {const features = [
    {
      icon: Shield,
      title: "Seguridad Avanzada",
      description: "Datos protegidos con encriptación de grado empresarial",
      color: "from-cyan-500 to-teal-600",
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
    {
      icon: Activity,
      title: "Tiempo Real",
      description: "Monitoreo y actualizaciones instantáneas",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzado",
      description: "Reportes y estadísticas detalladas de tu negocio",
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      icon: Users,
      title: "Gestión de Usuarios",
      description: "Administra usuarios y permisos de forma eficiente",
      color: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-1/2 p-12 lg:p-16 xl:p-20 flex-col justify-between relative z-10">
      <div className="relative z-10">
        {/* Mensaje de bienvenida mejorado */}
        <div className="mb-10 animate-in fade-in slide-in-from-left duration-700 delay-100">
          <h1 className="text-5xl xl:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            Sistema de Gestión
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Inteligente
            </span>
          </h1>
        </div>

        {/* Tarjetas de características en grid 2x2 */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`${feature.bgColor} rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom duration-500`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300`}
                  ></div>
                  <Icon className="h-6 w-6 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer izquierdo mejorado */}
      <div className="relative z-10 mt-auto pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">
{`© ${new Date().getFullYear()} SAS. Todos los derechos reservados.`}
        </p>
      </div>
    </div>
  );
}
