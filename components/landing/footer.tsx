"use client"

import { BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FooterProps {
  onContactClick: () => void
}

export function Footer({ onContactClick }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventData)
    }
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        ...eventData
      })
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

  return (
    <footer className="border-t bg-muted/50 py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SmartPOS</span>
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
              {["Documentación", "Casos de Éxito", "Webinars", "Guías"].map((link, j) => (
                <li key={j}>
                  <button
                    onClick={onContactClick}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline text-left"
                  >
                    {link}
                  </button>
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
                    onClick={onContactClick}
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
                <Button type="submit" disabled={newsletterSubmitting} className="bg-gradient-to-r from-blue-600 to-emerald-600">
                  {newsletterSubmitting ? '...' : 'Suscribirse'}
                </Button>
              </div>
              {newsletterError && <p className="text-sm text-red-500">{newsletterError}</p>}
            </form>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} Nuwesoft.</div>
          <div className="flex gap-6">
            <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
