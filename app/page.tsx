"use client"

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Key,
  Layers,
  Mail,
  MessageSquare,
  Package,
  PieChart,
  Play,
  Quote,
  Receipt,
  Server,
  Shield,
  Smartphone,
  Store,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
  Star,
  Menu,
  X,
  Gift,
  ExternalLink,
  Lock,
  Bell,
  ShoppingBag
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({ organizations: 1000, customers: 5000, monthlySales: 50000, products: 10000 })
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '', phone: '' })
  const [contactFormErrors, setContactFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactStep, setContactStep] = useState(1)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false)
  const [showVideoDemo, setShowVideoDemo] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)
  const [activeUsers, setActiveUsers] = useState(42)
  const [viewingPage, setViewingPage] = useState(12)
  const [roiCalculator, setRoiCalculator] = useState({ employees: 5, salesPerMonth: 10000, timeSaved: 10 })
  const [roiResult, setRoiResult] = useState<number | null>(null)
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const exitIntentRef = useRef(false)

  // Cargar estadísticas dinámicas
  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {}) // Silenciar errores, usar valores por defecto
  }, [])

  // Simular usuarios activos y personas viendo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1)
      setViewingPage(prev => prev + Math.floor(Math.random() * 5) - 2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(progress)

      // Show exit intent at 70% scroll
      if (progress > 70 && !exitIntentRef.current) {
        exitIntentRef.current = true
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && exitIntentRef.current && !showExitIntent) {
        setShowExitIntent(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [showExitIntent])

  // Validar email en tiempo real
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar formulario de contacto
  const validateContactForm = () => {
    const errors: Record<string, string> = {}
    if (!contactForm.name.trim()) errors.name = 'El nombre es requerido'
    if (!contactForm.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!validateEmail(contactForm.email)) {
      errors.email = 'Email inválido'
    }
    if (!contactForm.message.trim()) errors.message = 'El mensaje es requerido'
    setContactFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Track events para analytics
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventData)
    }
    // También para otros analytics
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        ...eventData
      })
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateContactForm()) {
      toast.error('Por favor completa todos los campos requeridos')
      trackEvent('form_validation_error', { form: 'contact' })
      return
    }
    setIsSubmitting(true)
    trackEvent('form_submit_start', { form: 'contact' })
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      })
      const data = await response.json()
      if (data.success) {
        trackEvent('form_submit_success', { form: 'contact' })
        toast.success('¡Gracias por contactarnos! Nos pondremos en contacto pronto.', {
          description: 'Te responderemos en menos de 24 horas',
          duration: 5000
        })
        setContactForm({ name: '', email: '', company: '', message: '', phone: '' })
        setContactFormErrors({})
        setContactStep(1)
        setContactDialogOpen(false)
      } else {
        trackEvent('form_submit_error', { form: 'contact', error: data.error })
        toast.error(data.error || 'Error al enviar el formulario')
      }
    } catch {
      trackEvent('form_submit_error', { form: 'contact', error: 'network_error' })
      toast.error('Error al enviar el formulario. Por favor intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) {
      setNewsletterError('Por favor ingresa tu email')
      return
    }
    if (!validateEmail(newsletterEmail)) {
      setNewsletterError('Email inválido')
      return
    }
    setNewsletterError('')
    setNewsletterSubmitting(true)
    trackEvent('newsletter_submit', { location: 'footer' })
    try {
      const response = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      })
      const data = await response.json()
      if (data.success) {
        trackEvent('newsletter_success', { location: 'footer' })
        toast.success('¡Gracias por suscribirte!', {
          description: 'Te mantendremos informado con las últimas novedades',
          duration: 5000
        })
        setNewsletterEmail('')
      } else {
        trackEvent('newsletter_error', { location: 'footer', error: data.error })
        toast.error(data.error || 'Error al suscribirse')
      }
    } catch {
      trackEvent('newsletter_error', { location: 'footer', error: 'network_error' })
      toast.error('Error al suscribirse. Por favor intenta nuevamente.')
    } finally {
      setNewsletterSubmitting(false)
    }
  }

  // Calcular ROI
  const calculateROI = () => {
    const monthlyCost = isAnnual ? 5000 / 12 : 450
    const timeValue = roiCalculator.employees * roiCalculator.timeSaved * 20 // horas * costo por hora estimado
    const salesIncrease = roiCalculator.salesPerMonth * 0.15 // 15% estimado de aumento
    const monthlyBenefit = timeValue + salesIncrease
    const roi = ((monthlyBenefit - monthlyCost) / monthlyCost) * 100
    setRoiResult(roi)
  }


  // Schema.org JSON-LD para SEO
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sistema de Ventas SAS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "250",
      "priceCurrency": "BOB",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "250",
        "priceCurrency": "BOB",
        "unitText": "MONTH"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127"
    },
    "description": "Plataforma empresarial todo-en-uno para gestión de ventas, inventario, CMS, cajas, gastos y cotizaciones."
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
        {/* Scroll Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-violet-600 z-[100] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      
      {/* Header Mejorado con Mobile Menu - Centrado */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto max-w-7xl relative flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
              Sistema de Ventas SAS
            </span>
          </div>

          {/* Desktop Nav - Centrado */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-1">
              <Link href="#features" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </Link>
              <Link href="#precios" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Precios
              </Link>
              <Link href="#testimonios" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Testimonios
              </Link>
              <Link href="#faq" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </div>
          </nav>

          {/* Botón Comenzar Gratis */}
          <div className="hidden md:flex items-center">
            <Link href="/administracion/login">
              <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all font-medium">
                Comenzar Gratis
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-xl">
            <div className="container px-4 py-6 space-y-2">
              <Link 
                href="#features" 
                className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funcionalidades
              </Link>
              <Link 
                href="#precios" 
                className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Precios
              </Link>
              <Link 
                href="#testimonios" 
                className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonios
              </Link>
              <Link 
                href="#faq" 
                className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <div className="border-t my-4" />
              <Link href="/administracion/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg text-lg font-medium">
                  Comenzar Gratis
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section - Más Impactante */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-44">
          {/* Fondo animado más sutil */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 opacity-5" />
          <div className="absolute top-20 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 -left-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-5xl text-center">
              {/* Badge con animación más suave */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-4 py-2 text-sm mb-8 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">Plataforma Multi-Tenant Empresarial</span>
              </div>

              {/* Título con mejor espaciado y animación por palabras */}
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[1.05]">
                {["Gestiona", "tu", "negocio", "completo"].map((word, i) => (
                  <span
                    key={i}
                    className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {word}{" "}
                  </span>
                ))}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                    en un solo lugar
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-blue-600/30 via-violet-600/30 to-blue-600/30 blur-xl animate-pulse" />
                </span>
              </h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                La plataforma <span className="font-bold text-foreground">todo-en-uno</span> para tu empresa: <br className="hidden sm:block" />
                <span className="text-foreground/80">Ventas • Inventario • CMS • Cajas • Gastos • Cotizaciones</span> y más.
              </p>

              {/* CTAs con micro-interacciones */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                <Link href="/administracion/login" onClick={() => trackEvent('cta_click', { location: 'hero', button: 'comenzar_gratis' })}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-lg px-10 h-14 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Comenzar Gratis
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-10 h-14 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-105 group"
                  onClick={() => {
                    setShowVideoDemo(true)
                    trackEvent('video_demo_click', { location: 'hero' })
                  }}
                >
                  Ver Demo en Vivo
                  <Star className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Button>
              </div>

              {/* Trust Badges con animación escalonada y Social Proof */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    </div>
                    <span><strong className="text-foreground">{activeUsers}</strong> usuarios activos ahora</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span><strong className="text-foreground">{viewingPage}</strong> personas viendo esta página</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {[
                    { text: "Sin tarjeta de crédito", bgClass: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", borderClass: "border-green-200 dark:border-green-800", iconClass: "text-green-600 dark:text-green-400" },
                    { text: "Setup en 5 minutos", bgClass: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30", borderClass: "border-blue-200 dark:border-blue-800", iconClass: "text-blue-600 dark:text-blue-400" },
                    { text: "Soporte Premium 24/7", bgClass: "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30", borderClass: "border-violet-200 dark:border-violet-800", iconClass: "text-violet-600 dark:text-violet-400" }
                  ].map((badge, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 ${badge.bgClass} px-4 py-2 rounded-full border ${badge.borderClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                      style={{ animationDelay: `${1100 + i * 100}ms` }}
                    >
                      <CheckCircle2 className={`h-5 w-5 ${badge.iconClass}`} />
                      <span className="font-medium">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Dinámicas */}
        <section className="py-20 border-y bg-gradient-to-r from-blue-50/70 via-violet-50/70 to-blue-50/70 dark:from-blue-950/30 dark:via-violet-950/30 dark:to-blue-950/30">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { label: "Empresas activas", value: `${stats.organizations.toLocaleString('en-US')}+`, icon: Building2 },
                { label: "Transacciones/mes", value: `${stats.monthlySales.toLocaleString('en-US')}+`, icon: TrendingUp },
                { label: "Clientes registrados", value: `${stats.customers.toLocaleString('en-US')}+`, icon: Users },
                { label: "Productos gestionados", value: `${stats.products.toLocaleString('en-US')}+`, icon: Package }
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center group cursor-default animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Demo / Screenshot Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-5 py-2 text-sm mb-6">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Vea el Sistema en Acción</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Descubre cómo funciona
              </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Vea cómo Sistema de Ventas SAS puede transformar la gestión de tu negocio
                </p>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-2xl bg-gradient-to-br from-blue-50/50 to-violet-50/50 dark:from-blue-950/30 dark:to-violet-950/30">
                {/* Placeholder para video o screenshot */}
                <div className="aspect-video relative group cursor-pointer" onClick={() => setShowVideoDemo(true)}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 shadow-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                        <Play className="h-10 w-10 text-white ml-1" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">Ver Demo Interactivo</p>
                      <p className="text-sm text-muted-foreground mt-2">Haz clic para reproducir</p>
                    </div>
                  </div>
                  {/* Aquí puedes agregar una imagen de screenshot real o un iframe de video */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-blue-600/10" />
                </div>
              </div>

              {/* Video Dialog */}
              <Dialog open={showVideoDemo} onOpenChange={setShowVideoDemo}>
                <DialogContent className="max-w-5xl">
                  <DialogHeader>
                    <DialogTitle>Demo del Sistema de Ventas SAS</DialogTitle>
                    <DialogDescription>
                      Vea cómo funciona nuestra plataforma completa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {/* TODO: Reemplaza 'VIDEO_ID_YOUTUBE' con el ID real de tu video de YouTube */}
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/VIDEO_ID_YOUTUBE"
                      title="Demo del Sistema de Ventas SAS"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Features - Más jerarquía y featured card destacada */}
        <section id="features" className="py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-950/60 px-5 py-2 text-sm mb-6 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-semibold text-violet-700 dark:text-violet-300">Funcionalidades Empresariales</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Todo lo que necesitas para crecer
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Una suite completa de herramientas profesionales para llevar tu negocio al siguiente nivel
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Package,
                    title: "Gestión de Productos",
                    description: "Control total de inventario, stock, precios y categorías. Sistema multi-sucursal con alertas inteligentes.",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: Users,
                    title: "CRM Integrado",
                    description: "Base de clientes completa con historial, preferencias y segmentación. Fideliza a tus clientes.",
                    gradient: "from-violet-500 to-purple-500"
                  },
                  {
                    icon: TrendingUp,
                    title: "Analytics Avanzados",
                    description: "Dashboards interactivos con métricas en tiempo real. Toma decisiones basadas en datos.",
                    gradient: "from-green-500 to-emerald-500"
                  },
                  {
                    icon: Receipt,
                    title: "Punto de Venta",
                    description: "POS completo con múltiples métodos de pago, impresión de tickets y gestión de devoluciones.",
                    gradient: "from-orange-500 to-red-500"
                  },
                  {
                    icon: Store,
                    title: "Multi-Sucursal",
                    description: "Administra todas tus sucursales desde un panel único. Inventario y reportes centralizados.",
                    gradient: "from-pink-500 to-rose-500"
                  },
                  {
                    icon: PieChart,
                    title: "Reportes Ejecutivos",
                    description: "Análisis profundo de ventas, clientes y productos. Exporta a Excel, PDF y más formatos.",
                    gradient: "from-indigo-500 to-blue-500"
                  },
                  {
                    icon: BookOpen,
                    title: "CMS Profesional",
                    description: "Gestiona tu sitio web y blog sin herramientas externas. SEO optimizado y responsive.",
                    gradient: "from-yellow-500 to-amber-500",
                    featured: true
                  },
                  {
                    icon: Clock,
                    title: "Control de Cajas",
                    description: "Gestiona cajas registradoras con apertura/cierre automático. Conciliación y auditoría completa.",
                    gradient: "from-teal-500 to-cyan-500"
                  },
                  {
                    icon: FileText,
                    title: "Cotizaciones Pro",
                    description: "Crea cotizaciones profesionales con seguimiento y conversión automática a ventas.",
                    gradient: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: DollarSign,
                    title: "Control Financiero",
                    description: "Registra gastos, categoriza y genera reportes financieros detallados por período.",
                    gradient: "from-red-500 to-orange-500"
                  },
                  {
                    icon: ShoppingBag,
                    title: "Gestión de Compras",
                    description: "Controla tus compras y proveedores. Genera órdenes de compra, seguimiento de pedidos y facturas de proveedores.",
                    gradient: "from-cyan-500 to-blue-500"
                  },
                  {
                    icon: Bell,
                    title: "Notificaciones Inteligentes",
                    description: "Alertas automáticas de stock bajo, pagos pendientes, nuevas ventas y eventos importantes. Configura tus preferencias.",
                    gradient: "from-rose-500 to-pink-500"
                  }
                ].map((feature, i) => (
                  <Card
                    key={i}
                    className={`group border-2 hover:border-transparent transition-all duration-300 hover:shadow-2xl cursor-pointer relative overflow-hidden ${
                      feature.featured
                        ? 'md:col-span-2 lg:col-span-1 ring-4 ring-violet-500/30 ring-offset-4 ring-offset-background scale-105'
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
                        {feature.featured && <span className="ml-2 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 px-2 py-1 rounded-full">Destacado</span>}
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

        {/* Benefits - Más compacto y visual */}
        <section className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-20">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  La ventaja competitiva que necesitas
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Tecnología empresarial de última generación al alcance de tu negocio
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Zap, title: "Ultra Rápido", desc: "Interfaz optimizada que responde en milisegundos.", color: "text-yellow-500" },
                  { icon: Shield, title: "Seguridad Militar", desc: "2FA, AES-256, JWT rotativo y auditoría.", color: "text-green-500" },
                  { icon: Layers, title: "Multi-Tenant SaaS", desc: "Datos aislados y seguros por organización.", color: "text-blue-500" },
                  { icon: Smartphone, title: "100% Responsive", desc: "Experiencia perfecta en todos los dispositivos.", color: "text-purple-500" },
                  { icon: BarChart3, title: "BI Integrado", desc: "KPIs y visualizaciones avanzadas en tiempo real.", color: "text-pink-500" },
                  { icon: Building2, title: "Escalabilidad Total", desc: "De 1 a 1000 sucursales sin cambiar de sistema.", color: "text-cyan-500" },
                  { icon: Key, title: "RBAC Granular", desc: "Permisos por rol, usuario y sucursal.", color: "text-orange-500" },
                  { icon: Server, title: "99.9% Uptime", desc: "Backups automáticos y redundancia global.", color: "text-red-500" },
                  { icon: BookOpen, title: "Headless CMS", desc: "API-first para total flexibilidad de contenido.", color: "text-indigo-500" }
                ].map((benefit, i) => (
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

        {/* Testimonios/Clientes */}
        <section id="testimonios" className="py-32 border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-5 py-2 text-sm mb-6">
                  <Quote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Lo que dicen nuestros clientes</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Confiado por empresas líderes
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Miles de empresas confían en Sistema de Ventas SAS para gestionar sus operaciones
                </p>
              </div>

              {/* Testimonios */}
              <div className="grid gap-6 md:grid-cols-3 mb-16">
                {[
                  {
                    name: "María González",
                    role: "CEO, Retail Plus",
                    company: "retail-plus",
                    testimonial: "Sistema de Ventas SAS transformó completamente nuestra operación. El control de inventario y reportes nos ahorró horas de trabajo diario.",
                    rating: 5
                  },
                  {
                    name: "Carlos Rodríguez",
                    role: "Director, TechStore",
                    company: "techstore",
                    testimonial: "La facilidad de uso y el soporte son excepcionales. Implementamos el sistema en todas nuestras sucursales sin problemas.",
                    rating: 5
                  },
                  {
                    name: "Ana Martínez",
                    role: "Gerente, Fashion Hub",
                    company: "fashion-hub",
                    testimonial: "El CMS integrado fue una sorpresa agradable. Ahora gestionamos nuestro sitio web y ventas desde un solo lugar.",
                    rating: 5
                  }
                ].map((testimonial, i) => (
                  <Card key={i} className="border-2 hover:border-primary/50 transition-all hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <Quote className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4 opacity-50" />
                      <CardDescription className="text-base leading-relaxed italic">
                        "{testimonial.testimonial}"
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Logos de clientes */}
              <div className="border-t pt-12">
                <p className="text-center text-sm text-muted-foreground mb-8">Empresas que confían en nosotros</p>
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
                  {['Retail Plus', 'TechStore', 'Fashion Hub', 'MarketPro', 'Business Solutions', 'Commerce Elite'].map((company, i) => (
                    <div key={i} className="flex items-center gap-2 px-6 py-3 rounded-lg border bg-muted/50">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-sm">{company}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Preguntas Frecuentes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Todo lo que necesitas saber sobre Sistema de Ventas SAS
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  {
                    question: "¿Necesito una tarjeta de crédito para comenzar?",
                    answer: "No, puedes comenzar completamente gratis sin necesidad de tarjeta de crédito. Ofrecemos un período de prueba gratuito para que explores todas las funcionalidades."
                  },
                  {
                    question: "¿Cuánto tiempo toma la configuración?",
                    answer: "La configuración inicial toma menos de 5 minutos. Nuestro sistema está diseñado para ser intuitivo y fácil de usar, incluso para usuarios sin experiencia técnica."
                  },
                  {
                    question: "¿Puedo gestionar múltiples sucursales?",
                    answer: "Sí, Sistema de Ventas SAS está diseñado para gestionar múltiples sucursales desde un panel centralizado. Puedes administrar inventario, reportes y usuarios para todas tus ubicaciones."
                  },
                  {
                    question: "¿Qué incluye el CMS integrado?",
                    answer: "El CMS incluye gestión de páginas estáticas y blog. Puedes crear contenido, gestionar SEO, y publicar sin necesidad de herramientas externas."
                  },
                  {
                    question: "¿Es seguro mi información?",
                    answer: "Absolutamente. Utilizamos encriptación AES-256, autenticación de dos factores (2FA), rotación de tokens JWT, y realizamos backups automáticos diarios."
                  },
                  {
                    question: "¿Puedo exportar mis datos?",
                    answer: "Sí, todos tus datos son tuyos. Puedes exportar reportes en múltiples formatos (Excel, PDF, CSV) en cualquier momento desde el panel de control."
                  },
                  {
                    question: "¿Hay límite de usuarios?",
                    answer: "Depende del plan que elijas. Nuestros planes incluyen diferentes límites de usuarios, pero podemos personalizar un plan según tus necesidades específicas."
                  },
                  {
                    question: "¿Ofrecen soporte técnico?",
                    answer: "Sí, ofrecemos soporte premium 24/7 por chat, email y teléfono. Nuestro equipo está disponible para ayudarte cuando lo necesites."
                  }
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-2 rounded-lg px-6 hover:border-primary/50 transition-colors">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Sección de Precios */}
        <section id="precios" className="py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-950/60 px-5 py-2 text-sm mb-6">
                  <Gift className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-semibold text-violet-700 dark:text-violet-300">Planes Flexibles</span>
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
                  className="relative inline-flex h-8 w-14 items-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  role="switch"
                  aria-checked={isAnnual}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      isAnnual ? 'translate-x-7' : 'translate-x-1'
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

              <div className="grid gap-8 md:grid-cols-4">
                {[
                  {
                    name: "Trial",
                    priceMonthly: "Gratis",
                    priceAnnual: "Gratis",
                    periodMonthly: "14 días",
                    periodAnnual: "14 días",
                    description: "Prueba sin compromiso",
                    features: [
                      "Acceso completo por 14 días",
                      "Hasta 50 productos",
                      "1 sucursal",
                      "2 usuarios",
                      "Reportes básicos",
                      "Soporte por email"
                    ],
                    cta: "Comenzar Trial",
                    popular: false
                  },
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
                      "Soporte por email",
                      "CMS básico"
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
                      "CMS completo",
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
                ].map((plan, i) => {
                  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
                  const period = isAnnual ? plan.periodAnnual : plan.periodMonthly
                  return (
                  <Card
                    key={i}
                    className={`relative border-2 transition-all hover:shadow-2xl ${
                      plan.popular
                        ? 'border-blue-500 ring-4 ring-blue-500/20 scale-105'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                          Más Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="mb-4">{plan.description}</CardDescription>
                      <div className="mb-6 min-h-[60px] flex items-center justify-center">
                        {price === "Personalizado" || price === "Gratis" ? (
                          <span className="text-2xl sm:text-3xl font-bold break-words">{price}</span>
                        ) : (
                          <>
                            <span className="text-5xl font-bold">{price}</span>
                            {period && <span className="text-muted-foreground ml-2">{period}</span>}
                          </>
                        )}
                      </div>
                      <Link 
                        href="/administracion/login" 
                        className="w-full block"
                        onClick={() => trackEvent('plan_selected', { plan: plan.name, period: isAnnual ? 'annual' : 'monthly' })}
                      >
                        <Button
                          size="lg"
                          className={`w-full ${
                            plan.popular
                              ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700'
                              : ''
                          }`}
                          variant={plan.popular ? 'default' : 'outline'}
                        >
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
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

        {/* Calculadora ROI */}
        <section className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Calcula tu Retorno de Inversión
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Descubre cuánto puedes ahorrar y aumentar tus ventas con nuestro sistema
                </p>
              </div>
              <Card className="p-8">
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="employees">Número de empleados</Label>
                    <Input
                      id="employees"
                      type="number"
                      min="1"
                      value={roiCalculator.employees}
                      onChange={(e) => setRoiCalculator({ ...roiCalculator, employees: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sales">Ventas mensuales (BOB)</Label>
                    <Input
                      id="sales"
                      type="number"
                      min="0"
                      value={roiCalculator.salesPerMonth}
                      onChange={(e) => setRoiCalculator({ ...roiCalculator, salesPerMonth: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSaved">Horas ahorradas/mes</Label>
                    <Input
                      id="timeSaved"
                      type="number"
                      min="0"
                      value={roiCalculator.timeSaved}
                      onChange={(e) => setRoiCalculator({ ...roiCalculator, timeSaved: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    calculateROI()
                    trackEvent('roi_calculator_used', { employees: roiCalculator.employees, sales: roiCalculator.salesPerMonth })
                  }} 
                  className="w-full mb-6" 
                  size="lg"
                >
                  Calcular ROI
                </Button>
                {roiResult !== null && (
                  <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {roiResult > 0 ? '+' : ''}{roiResult.toFixed(0)}%
                      </div>
                      <p className="text-lg text-muted-foreground">
                        Retorno de Inversión Estimado
                      </p>
                      {roiResult > 100 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          ¡Excelente! El sistema se pagará por sí mismo en menos de un mes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* Comparativa de Planes */}
        <section className="py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Compara nuestros planes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Todas las características en un vistazo
                </p>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold">Característica</th>
                        <th className="text-center p-4 font-bold">Trial</th>
                        <th className="text-center p-4 font-bold">Starter</th>
                        <th className="text-center p-4 font-bold bg-blue-50 dark:bg-blue-950/30">Professional</th>
                        <th className="text-center p-4 font-bold">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Productos", trial: "50", starter: "100", pro: "Ilimitados", enterprise: "Ilimitados" },
                        { feature: "Sucursales", trial: "1", starter: "1", pro: "Ilimitadas", enterprise: "Ilimitadas" },
                        { feature: "Usuarios", trial: "2", starter: "3", pro: "Ilimitados", enterprise: "Ilimitados" },
                        { feature: "Reportes", trial: "Básicos", starter: "Básicos", pro: "Avanzados", enterprise: "Avanzados" },
                        { feature: "Soporte", trial: "Email", starter: "Email", pro: "24/7 Prioritario", enterprise: "Dedicado" },
                        { feature: "CMS", trial: "No", starter: "Básico", pro: "Completo", enterprise: "Completo" },
                        { feature: "API", trial: "No", starter: "No", pro: "Sí", enterprise: "Premium" },
                        { feature: "Backups", trial: "No", starter: "No", pro: "Automáticos", enterprise: "Automáticos" },
                        { feature: "SLA", trial: "No", starter: "No", pro: "No", enterprise: "Garantizado" },
                        { feature: "White Label", trial: "No", starter: "No", pro: "No", enterprise: "Sí" }
                      ].map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center">{row.trial}</td>
                          <td className="p-4 text-center">{row.starter}</td>
                          <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-950/20">{row.pro}</td>
                          <td className="p-4 text-center">{row.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Integraciones */}
        <section className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Integraciones Potentes
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Conecta Sistema de Ventas SAS con tus herramientas favoritas
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-4">
                {[
                  { name: "API REST", desc: "Integración completa via API", icon: Server },
                  { name: "Webhooks", desc: "Notificaciones en tiempo real", icon: Zap },
                  { name: "Excel", desc: "Importación/Exportación", icon: FileText },
                  { name: "Email", desc: "Notificaciones automáticas", icon: Mail },
                  { name: "SMS", desc: "Alertas por mensaje de texto", icon: MessageSquare },
                  { name: "Contabilidad", desc: "Sincronización financiera", icon: DollarSign },
                  { name: "E-commerce", desc: "Tiendas online", icon: Store },
                  { name: "Marketing", desc: "Herramientas de marketing", icon: TrendingUp }
                ].map((integration, i) => (
                  <Card key={i} className="text-center hover:shadow-lg transition-all border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 mx-auto mb-4">
                        <integration.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-sm">{integration.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
                  </div>
        </section>

        {/* Blog Preview */}
        <section className="py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                    Últimas noticias y recursos
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Aprende consejos y mejores prácticas para hacer crecer tu negocio
                  </p>
                </div>
                <Link href="/administracion/cms">
                  <Button variant="outline" className="hidden md:flex">
                    Ver todos los artículos
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: "Cómo aumentar tus ventas con analytics",
                    excerpt: "Descubre cómo usar los reportes avanzados para tomar mejores decisiones de negocio.",
                    date: "15 Nov 2024",
                    category: "Ventas"
                  },
                  {
                    title: "Guía completa de gestión de inventario",
                    excerpt: "Aprende las mejores prácticas para mantener tu inventario organizado y optimizado.",
                    date: "10 Nov 2024",
                    category: "Inventario"
                  },
                  {
                    title: "Optimiza tu proceso de cotizaciones",
                    excerpt: "Convierte más cotizaciones en ventas con estos consejos probados por nuestros clientes.",
                    date: "5 Nov 2024",
                    category: "Procesos"
                  }
                ].map((post, i) => (
                  <Card key={i} className="group hover:shadow-xl transition-all border-2 hover:border-primary/50 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded">
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                      </div>
                      <CardTitle className="text-xl mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="leading-relaxed">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/administracion/cms" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                        Leer más
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8 md:hidden">
                <Link href="/administracion/cms">
                  <Button variant="outline">
                    Ver todos los artículos
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final - Más persuasivo */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-blue-600/10" />
          <div className="container mx-auto max-w-7xl px-4 relative">
            <div className="mx-auto max-w-4xl">
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/70 via-background to-violet-50/70 dark:from-blue-950/40 dark:via-background dark:to-violet-950/40 shadow-2xl backdrop-blur-sm">
                <CardHeader className="text-center pb-8 pt-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-100/80 dark:bg-blue-950/70 px-5 py-2 text-sm mb-6 mx-auto backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Comienza hoy mismo</span>
                  </div>
                  <CardTitle className="text-4xl sm:text-5xl mb-6 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    Transforma tu negocio ahora
                  </CardTitle>
                  <CardDescription className="text-xl leading-relaxed max-w-2xl mx-auto">
                    Únete a más de <span className="font-bold text-foreground">1,000 empresas</span> que ya están creciendo con Sistema de Ventas SAS. <br className="hidden sm:block" />
                    <span className="text-foreground/70">Sin compromisos. Sin tarjeta de crédito.</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
                  <Link 
                    href="/administracion/login"
                    onClick={() => trackEvent('cta_click', { location: 'final_cta', button: 'comenzar_gratis_ahora' })}
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg px-12 h-16 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 group"
                    >
                      Comenzar Gratis Ahora
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto text-lg px-12 h-16 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all hover:scale-105"
                      >
                        Hablar con Ventas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Contacta con nuestro equipo</DialogTitle>
                        <DialogDescription>
                          Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas.
                        </DialogDescription>
                      </DialogHeader>
                      {contactStep === 1 ? (
                        <div className="space-y-4">
                          <div className="mb-4">
                            <Progress value={33} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">Paso 1 de 3</p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nombre completo *</Label>
                              <Input
                                id="name"
                                required
                                value={contactForm.name}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, name: e.target.value })
                                  if (contactFormErrors.name) setContactFormErrors({ ...contactFormErrors, name: '' })
                                }}
                                placeholder="Tu nombre"
                                className={contactFormErrors.name ? 'border-red-500' : ''}
                              />
                              {contactFormErrors.name && <p className="text-sm text-red-500">{contactFormErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                required
                                value={contactForm.email}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, email: e.target.value })
                                  if (contactFormErrors.email) setContactFormErrors({ ...contactFormErrors, email: '' })
                                  if (e.target.value && !validateEmail(e.target.value)) {
                                    setContactFormErrors({ ...contactFormErrors, email: 'Email inválido' })
                                  }
                                }}
                                placeholder="tu@email.com"
                                className={contactFormErrors.email ? 'border-red-500' : ''}
                              />
                              {contactFormErrors.email && <p className="text-sm text-red-500">{contactFormErrors.email}</p>}
                            </div>
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button type="button" onClick={() => setContactStep(2)} className="flex-1" disabled={!contactForm.name || !contactForm.email || !validateEmail(contactForm.email)}>
                              Continuar
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : contactStep === 2 ? (
                        <div className="space-y-4">
                          <div className="mb-4">
                            <Progress value={66} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">Paso 2 de 3</p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="company">Empresa</Label>
                              <Input
                                id="company"
                                value={contactForm.company}
                                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                                placeholder="Nombre de tu empresa"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Teléfono</Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={contactForm.phone}
                                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                placeholder="+591 12345678"
                              />
                            </div>
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button type="button" onClick={() => setContactStep(1)} variant="outline">
                              Atrás
                            </Button>
                            <Button type="button" onClick={() => setContactStep(3)} className="flex-1">
                              Continuar
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                          <div className="mb-4">
                            <Progress value={100} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">Paso 3 de 3</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="message">Mensaje *</Label>
                            <Textarea
                              id="message"
                              required
                              rows={4}
                              value={contactForm.message}
                              onChange={(e) => {
                                setContactForm({ ...contactForm, message: e.target.value })
                                if (contactFormErrors.message) setContactFormErrors({ ...contactFormErrors, message: '' })
                              }}
                              placeholder="Cuéntanos sobre tu proyecto o pregunta..."
                              className={contactFormErrors.message ? 'border-red-500' : ''}
                            />
                            {contactFormErrors.message && <p className="text-sm text-red-500">{contactFormErrors.message}</p>}
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button type="button" onClick={() => setContactStep(2)} variant="outline">
                              Atrás
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                              {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                              <Mail className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparación con Competencia */}
        <section className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Nosotros vs Competencia
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Descubre por qué somos la mejor opción para tu negocio
                </p>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold">Característica</th>
                        <th className="text-center p-4 font-bold bg-blue-50 dark:bg-blue-950/30">Sistema de Ventas SAS</th>
                        <th className="text-center p-4 font-bold">Competencia A</th>
                        <th className="text-center p-4 font-bold">Competencia B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Multi-sucursal", us: "✓ Incluido", comp1: "✗ Plan Premium", comp2: "✗ No disponible" },
                        { feature: "CMS Integrado", us: "✓ Incluido", comp1: "✗ No", comp2: "✗ No" },
                        { feature: "API REST", us: "✓ Incluido", comp1: "✗ Plan Enterprise", comp2: "✓ Incluido" },
                        { feature: "Soporte 24/7", us: "✓ Incluido", comp1: "✗ Solo email", comp2: "✓ Plan Premium" },
                        { feature: "Backups Automáticos", us: "✓ Incluido", comp1: "✗ Manual", comp2: "✓ Plan Premium" },
                        { feature: "Precio Mensual", us: "Desde 250 BOB", comp1: "Desde 500 BOB", comp2: "Desde 600 BOB" }
                      ].map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-950/20 font-semibold text-blue-600 dark:text-blue-400">{row.us}</td>
                          <td className="p-4 text-center text-muted-foreground">{row.comp1}</td>
                          <td className="p-4 text-center text-muted-foreground">{row.comp2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Seguridad y Certificaciones */}
        <section className="py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-950/60 px-5 py-2 text-sm mb-6">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">Seguridad y Certificaciones</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Tu información está segura con nosotros
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Implementamos las mejores prácticas de seguridad de la industria
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { icon: Shield, title: "Encriptación AES-256", desc: "Todos tus datos están encriptados con el estándar militar" },
                  { icon: Key, title: "Autenticación 2FA", desc: "Protección adicional con autenticación de dos factores" },
                  { icon: Server, title: "Backups Diarios", desc: "Respaldo automático de todos tus datos cada 24 horas" },
                  { icon: Layers, title: "Aislamiento Multi-Tenant", desc: "Cada organización tiene sus datos completamente aislados" },
                  { icon: CheckCircle2, title: "Certificación ISO 27001", desc: "Cumplimos con los estándares internacionales de seguridad" },
                  { icon: Lock, title: "JWT Rotativo", desc: "Tokens de autenticación que se renuevan automáticamente" }
                ].map((item, i) => (
                  <Card key={i} className="text-center hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 mx-auto mb-4">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="text-sm">{item.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                {['ISO 27001', 'SOC 2', 'GDPR Compliant', 'SSL/TLS'].map((cert, i) => (
                  <div key={i} className="px-4 py-2 rounded-lg border bg-muted/50">
                    <span className="text-sm font-semibold">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  Roadmap de Producto
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Próximas características que estamos desarrollando
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { quarter: "Q1 2025", features: ["App móvil iOS/Android", "Integración con WhatsApp Business", "Dashboard de analytics mejorado"] },
                  { quarter: "Q2 2025", features: ["IA para predicción de ventas", "Integración con Stripe/PayPal", "Reportes automatizados por email"] },
                  { quarter: "Q3 2025", features: ["Marketplace de plugins", "API GraphQL", "Soporte multi-idioma"] }
                ].map((roadmap, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-2xl mb-4">{roadmap.quarter}</CardTitle>
                      <ul className="space-y-2">
                        {roadmap.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <Dialog open={showExitIntent} onOpenChange={setShowExitIntent}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">¡Espera! 🎁</DialogTitle>
              <DialogDescription>
                Obtén un <strong>20% de descuento</strong> en tu primer mes al suscribirte ahora
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No te pierdas esta oferta especial. Código: <strong>WELCOME20</strong>
              </p>
              <div className="flex gap-2">
                <Link 
                  href="/administracion/login" 
                  className="flex-1"
                  onClick={() => {
                    trackEvent('exit_intent_conversion', { offer: '20_percent_off' })
                    setShowExitIntent(false)
                  }}
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600">
                    Aprovechar Oferta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowExitIntent(false)}>
                  No, gracias
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer - Más limpio */}
      <footer className="border-t bg-muted/50 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-4 mb-12">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Sistema de Ventas SAS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                La plataforma empresarial todo-en-uno que revoluciona la gestión de negocios con tecnología de vanguardia.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Características", "Precios", "Integraciones", "API"].map((link, j) => (
                  <li key={j}>
                    <Link href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Documentación", "Blog", "Casos de Éxito", "Webinars"].map((link, j) => (
                  <li key={j}>
                    <Link href="/administracion/cms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Centro de Ayuda", "Chat en Vivo", "Contacto", "Estado del Sistema"].map((link, j) => (
                  <li key={j}>
                    <button 
                      onClick={() => setContactDialogOpen(true)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline text-left"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Newsletter Signup */}
          <div className="border-t pt-12 mt-12">
            <div className="max-w-md mx-auto">
              <h4 className="font-bold text-lg mb-4 text-center">Suscríbete a nuestro newsletter</h4>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Recibe tips, actualizaciones y recursos exclusivos
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value)
                      setNewsletterError('')
                      if (e.target.value && !validateEmail(e.target.value)) {
                        setNewsletterError('Email inválido')
                      }
                    }}
                    required
                    className={`flex-1 ${newsletterError ? 'border-red-500' : ''}`}
                  />
                  <Button type="submit" disabled={newsletterSubmitting} className="bg-gradient-to-r from-blue-600 to-violet-600">
                    {newsletterSubmitting ? '...' : 'Suscribirse'}
                  </Button>
                </div>
                {newsletterError && <p className="text-sm text-red-500">{newsletterError}</p>}
              </form>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} Sistema de Ventas SAS. Todos los derechos reservados.</div>
            <div className="flex gap-6">
              <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}