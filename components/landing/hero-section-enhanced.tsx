"use client"

import { ArrowRight, CheckCircle2, Star, Zap, TrendingUp, Shield, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  mounted: boolean
  activeUsers: number
  viewingPage: number
  onContactClick: () => void
  trackEvent: (eventName: string, eventData?: Record<string, any>) => void
}

export function HeroSectionEnhanced({ mounted, activeUsers, onContactClick, trackEvent }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-44">
      {/* Fondo animado mejorado */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 opacity-5" />

      {/* Gradientes animados */}
      <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -left-40 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Columna Izquierda - Contenido */}
          <div className="text-center lg:text-left">
            {/* Badge mejorado */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-4 py-2 text-sm mb-8 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">🚀 Plataforma #1 en Bolivia</span>
            </div>

            {/* Título con animación mejorada */}
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl mb-8 text-balance leading-[1.05]">
              <span className="block animate-in fade-in slide-in-from-bottom-8 duration-700">
                Gestiona tu negocio
              </span>
              <span className="block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                completo{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                    en un solo lugar
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-blue-600/30 via-emerald-600/30 to-blue-600/30 blur-xl animate-pulse" />
                </span>
              </span>
            </h1>

            <p className="text-xl leading-relaxed text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              El sistema de <span className="font-bold text-foreground">punto de venta más completo</span> de Bolivia.
              <br className="hidden sm:block" />
              <span className="text-foreground/80">Aumenta tus ventas hasta un 40% con tecnología inteligente.</span>
            </p>

            {/* Características rápidas */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              {[
                { icon: TrendingUp, text: "Aumenta ventas 40%" },
                { icon: Shield, text: "100% Seguro" },
                { icon: Zap, text: "Setup en 5 min" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-border/50">
                  <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTAs mejorados */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
              <Button
                size="lg"
                onClick={() => {
                  onContactClick()
                  trackEvent('cta_click', { location: 'hero', button: 'empezar_ahora' })
                }}
                className="w-full sm:w-auto text-lg px-10 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center font-bold">
                  Empezar Ahora - Gratis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-10 h-16 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-105 group"
                >
                  Ver Demo
                  <Star className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Button>
              </a>
            </div>

            {/* Social Proof mejorado */}
            {mounted && (
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-emerald-600 border-2 border-background flex items-center justify-center text-white text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-foreground">{activeUsers}+</strong> usuarios activos</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1"><strong className="text-foreground">4.9/5</strong> (127 reseñas)</span>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha - Visual */}
          <div className="relative lg:block hidden animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
            {/* Mockup del dashboard */}
            <div className="relative">
              {/* Tarjeta principal con efecto glassmorphism */}
              <div className="relative bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/50 dark:to-emerald-950/50 rounded-2xl shadow-2xl border border-border/50 backdrop-blur-sm p-8 transform hover:scale-105 transition-transform duration-500">
                {/* Header del mockup */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">Dashboard</div>
                </div>

                {/* Contenido del mockup */}
                <div className="space-y-4">
                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Ventas Hoy", value: "Bs. 12,450", change: "+23%" },
                      { label: "Productos", value: "1,234", change: "+12%" }
                    ].map((metric, i) => (
                      <div key={i} className="bg-background/50 rounded-lg p-4 border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">{metric.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico simulado */}
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-end justify-between h-32 gap-2">
                      {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-emerald-600 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50">
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-600 to-emerald-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Producto {i}</div>
                          <div className="text-xs text-muted-foreground">Stock: {100 - i * 10}</div>
                        </div>
                        <div className="text-sm font-bold">Bs. {(i * 50).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elementos flotantes decorativos */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl animate-pulse delay-700" />
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {[
              { text: "Setup en 5 minutos", bgClass: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30", borderClass: "border-blue-200 dark:border-blue-800", iconClass: "text-blue-600 dark:text-blue-400" },
              { text: "Soporte Premium 24/7", bgClass: "bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-950/30 dark:to-purple-950/30", borderClass: "border-emerald-200 dark:border-emerald-800", iconClass: "text-emerald-600 dark:text-emerald-400" },
              { text: "Seguridad Garantizada", bgClass: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", borderClass: "border-green-200 dark:border-green-800", iconClass: "text-green-600 dark:text-green-400" }
            ].map((badge, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${badge.bgClass} px-6 py-3 rounded-full border ${badge.borderClass} shadow-lg hover:scale-105 transition-transform`}
              >
                <CheckCircle2 className={`h-5 w-5 ${badge.iconClass}`} />
                <span className="font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </section>
  )
}
