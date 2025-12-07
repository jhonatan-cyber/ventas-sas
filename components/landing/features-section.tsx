"use client"

import {
  Clock,
  DollarSign,
  FileText,
  Package,
  PieChart,
  Receipt,
  Sparkles,
  Store,
  TrendingUp,
  Users
} from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Package,
    title: "Inventario Inteligente",
    description: "Controla tu stock en tiempo real. Alertas automáticas de productos bajos, transferencias entre sucursales y reportes detallados.",
    gradient: "from-blue-500 to-cyan-500",
    featured: false
  },
  {
    icon: Users,
    title: "Gestión de Clientes",
    description: "Registra clientes con CI, historial de compras y preferencias. Identifica a tus mejores clientes y fidelízalos.",
    gradient: "from-emerald-500 to-teal-500",
    featured: false
  },
  {
    icon: TrendingUp,
    title: "Reportes Poderosos",
    description: "Visualiza tus ventas, productos más vendidos, ganancias y tendencias. Exporta a Excel y PDF con un clic.",
    gradient: "from-green-500 to-emerald-500",
    featured: false
  },
  {
    icon: Receipt,
    title: "Punto de Venta Rápido",
    description: "Vende en segundos. Acepta efectivo, tarjeta, QR y transferencias. Imprime tickets térmicos automáticamente.",
    gradient: "from-orange-500 to-amber-500",
    featured: false
  },
  {
    icon: Store,
    title: "Multi-Sucursal",
    description: "¿Tienes varias tiendas? Controla todo desde un solo lugar. Transfiere productos, compara ventas y unifica reportes.",
    gradient: "from-blue-500 to-indigo-500",
    featured: false
  },
  {
    icon: PieChart,
    title: "Reportes Ejecutivos",
    description: "Análisis profundo de ventas, clientes y productos. Exporta a Excel, PDF y más formatos.",
    gradient: "from-indigo-500 to-blue-500",
    featured: false
  },
  {
    icon: Clock,
    title: "Control de Cajas",
    description: "Abre y cierra cajas con montos iniciales. Registra ingresos, egresos y cuadra al final del día sin errores.",
    gradient: "from-teal-500 to-cyan-500",
    featured: false
  },
  {
    icon: FileText,
    title: "Cotizaciones Pro",
    description: "Crea cotizaciones profesionales con seguimiento y conversión automática a ventas.",
    gradient: "from-purple-500 to-pink-500",
    featured: false
  },
  {
    icon: DollarSign,
    title: "Control Financiero",
    description: "Registra gastos, categoriza y genera reportes financieros detallados por período.",
    gradient: "from-red-500 to-orange-500",
    featured: false
  },
  /*  {
     icon: ShoppingBag,
     title: "Gestión de Compras",
     description: "Próximamente: Controla tus compras y proveedores. Genera órdenes de compra, seguimiento de pedidos y facturas de proveedores.",
     gradient: "from-cyan-500 to-blue-500",
     featured: false,
     comingSoon: true
   },
   {
     icon: Bell,
     title: "Notificaciones Inteligentes",
     description: "Alertas automáticas de stock bajo, pagos pendientes, nuevas ventas y eventos importantes. Configura tus preferencias.",
     gradient: "from-rose-500 to-pink-500",
     featured: false
   } */
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 px-5 py-2 text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Funcionalidades Empresariales</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Potencia tus ventas con tecnología profesional
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Controla cada aspecto de tu negocio desde un solo lugar. Aumenta tus ventas, reduce costos y toma mejores decisiones.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Card
                key={i}
                className={`group border-2 hover:border-transparent transition-all duration-300 hover:shadow-2xl cursor-pointer relative overflow-hidden ${feature.featured
                    ? 'md:col-span-2 lg:col-span-1 ring-4 ring-emerald-500/30 ring-offset-4 ring-offset-background scale-105'
                    : ''
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardHeader className="relative pb-6">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                    {feature.featured && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-1 rounded-full">Destacado</span>}
                    {/*    {feature.comingSoon && <span className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-1 rounded-full">Próximamente</span>} */}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
