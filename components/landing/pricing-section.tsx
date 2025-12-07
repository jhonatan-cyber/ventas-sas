"use client"

import { ArrowRight, Check, Gift } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingSectionProps {
  onContactClick: () => void
  trackEvent: (eventName: string, eventData?: Record<string, any>) => void
}

const plans = [
  {
    name: "Starter",
    priceMonthly: "250",
    priceAnnual: "2500",
    periodMonthly: " BOB/mes",
    periodAnnual: " BOB/año",
    description: "Perfecto para comenzar",
    features: [
      "Hasta 100 productos",
      "1 sucursal",
      "3 usuarios",
      "Reportes básicos",
      "Soporte por email"
    ],
    cta: "Comenzar Ahora",
    popular: false
  },
  {
    name: "Professional",
    priceMonthly: "450",
    priceAnnual: "5000",
    periodMonthly: " BOB/mes",
    periodAnnual: " BOB/año",
    description: "Para empresas en crecimiento",
    features: [
      "Productos ilimitados",
      "Sucursales ilimitadas",
      "Usuarios ilimitados",
      "Reportes avanzados",
      "Soporte prioritario 24/7",
      "Integraciones API",
      "Backups automáticos"
    ],
    cta: "Comenzar Ahora",
    popular: true
  },
  {
    name: "Enterprise",
    priceMonthly: "Personalizado",
    priceAnnual: "Personalizado",
    periodMonthly: "",
    periodAnnual: "",
    description: "Para grandes organizaciones",
    features: [
      "Todo en Professional",
      "SLA garantizado",
      "Soporte dedicado",
      "Capacitación personalizada",
      "White label",
      "Dominios personalizados",
      "Integraciones premium",
      "Gestor de cuenta dedicado"
    ],
    cta: "Contactar Ventas",
    popular: false
  }
]

export function PricingSection({ onContactClick, trackEvent }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="precios" className="py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 px-5 py-2 text-sm mb-6">
              <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Planes Flexibles</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Elige el plan perfecto para ti
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desde startups hasta grandes empresas, tenemos un plan que se adapta a tus necesidades
            </p>
          </div>

          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <button
              onClick={() => {
                setIsAnnual(!isAnnual)
                trackEvent('pricing_toggle', { to: !isAnnual ? 'annual' : 'monthly' })
              }}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              role="switch"
              aria-checked={isAnnual}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isAnnual && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                Ahorra hasta 17%
              </span>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
              const period = isAnnual ? plan.periodAnnual : plan.periodMonthly
              return (
                <Card
                  key={i}
                  className={`relative border-2 transition-all hover:shadow-2xl ${plan.popular
                      ? 'border-blue-500 ring-4 ring-blue-500/20 scale-105'
                      : 'hover:border-primary/50'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="mb-4">{plan.description}</CardDescription>
                    <div className="mb-6 min-h-[60px] flex items-center justify-center">
                      {price === "Personalizado" ? (
                        <span className="text-2xl sm:text-3xl font-bold break-words">{price}</span>
                      ) : (
                        <>
                          <span className="text-5xl font-bold">{price}</span>
                          {period && <span className="text-muted-foreground ml-2">{period}</span>}
                        </>
                      )}
                    </div>
                    <Button
                      size="lg"
                      onClick={() => {
                        onContactClick()
                        trackEvent('plan_selected', { plan: plan.name, period: isAnnual ? 'annual' : 'monthly' })
                      }}
                      className={`w-full ${plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700'
                          : ''
                        }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
