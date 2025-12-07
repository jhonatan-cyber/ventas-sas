"use client"

import {
  BarChart3,
  Building2,
  Key,
  Layers,
  Server,
  Shield,
  Smartphone,
  Zap
} from "lucide-react"

const benefits = [
  { icon: Zap, title: "Ultra Rápido", desc: "Interfaz optimizada que responde en milisegundos.", color: "text-yellow-500" },
  { icon: Shield, title: "Seguridad Militar", desc: "2FA, AES-256, JWT rotativo y auditoría.", color: "text-green-500" },
  { icon: Layers, title: "Multi-Tenant SaaS", desc: "Datos aislados y seguros por organización.", color: "text-blue-500" },
  { icon: Smartphone, title: "100% Responsive", desc: "Experiencia perfecta en todos los dispositivos.", color: "text-purple-500" },
  { icon: BarChart3, title: "BI Integrado", desc: "KPIs y visualizaciones avanzadas en tiempo real.", color: "text-pink-500" },
  { icon: Building2, title: "Escalabilidad Total", desc: "De 1 a 1000 sucursales sin cambiar de sistema.", color: "text-cyan-500" },
  { icon: Key, title: "RBAC Granular", desc: "Permisos por rol, usuario y sucursal.", color: "text-orange-500" },
  { icon: Server, title: "99.9% Uptime", desc: "Backups automáticos y redundancia global.", color: "text-red-500" }
]

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Tecnología que impulsa resultados reales
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Diseñado para negocios bolivianos que quieren crecer. Rápido, seguro y fácil de usar.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-2xl hover:bg-card/50 transition-all group cursor-pointer border border-transparent hover:border-border/50 backdrop-blur-sm"
              >
                <div className="flex-shrink-0">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${benefit.color} bg-current/10 group-hover:scale-110 transition-transform`}>
                    <benefit.icon className={`h-7 w-7 ${benefit.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
