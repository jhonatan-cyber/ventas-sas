"use client"

import { useEffect, useState, useRef } from "react"

import { BenefitsSection } from "@/components/landing/benefits-section"
import { ContactDialog } from "@/components/landing/contact-dialog"
import { FAQSection } from "@/components/landing/faq-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { Footer } from "@/components/landing/footer"
import { HeaderEnhanced } from "@/components/landing/header-enhanced"
import { HeroSectionEnhanced } from "@/components/landing/hero-section-enhanced"
import { PricingSection } from "@/components/landing/pricing-section"
import { StatsSection } from "@/components/landing/stats-section"
import { useContactForm } from "@/hooks/landing/use-contact-form"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats] = useState({ organizations: 50, customers: 1000, monthlySales: 10000, products: 5000 })
  const [activeUsers, setActiveUsers] = useState(42)
  const [viewingPage, setViewingPage] = useState(12)
  const [scrollProgress, setScrollProgress] = useState(0)
  const exitIntentRef = useRef(false)

  // Use contact form hook
  const {
    contactForm,
    setContactForm,
    contactFormErrors,
    setContactFormErrors,
    isSubmitting,
    contactDialogOpen,
    setContactDialogOpen,
    contactStep,
    setContactStep,
    validateEmail,
    handleContactSubmit,
    trackEvent
  } = useContactForm()

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load dynamic stats (comentado para usar valores estáticos)
  // useEffect(() => {
  //   fetch('/api/public/stats')
  //     .then(res => res.json())
  //     .then(data => setStats(data))
  //     .catch(() => { })
  // }, [])

  // Simulate active users
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 2) - 1)
      setViewingPage(prev => prev + Math.floor(Math.random() * 2) - 2)
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

      if (progress > 70 && !exitIntentRef.current) {
        exitIntentRef.current = true
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Schema.org JSON-LD for SEO
  const schemaOrg = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://smartpos.bo/#organization",
        "name": "SmartPOS Bolivia",
        "url": "https://smartpos.bo",
        "logo": {
          "@type": "ImageObject",
          "url": "https://smartpos.bo/logo.png",
          "width": 512,
          "height": 512
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+591-70000000",
          "contactType": "customer service",
          "availableLanguage": "Spanish"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BO",
          "addressLocality": "La Paz"
        },
        "sameAs": [
          "https://facebook.com/smartposbolivia",
          "https://instagram.com/smartposbolivia"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://smartpos.bo/#software",
        "name": "SmartPOS",
        "alternateName": "Smart Point of Sale",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Point of Sale System",
        "operatingSystem": "Web Browser",
        "softwareVersion": "2.0",
        "releaseNotes": "Sistema POS con IA integrada y gestión multi-sucursal",
        "description": "SmartPOS es el sistema de punto de venta más avanzado de Bolivia. Gestión completa de ventas, inventario inteligente con IA, control de cajas, gastos, cotizaciones y reportes en tiempo real. Ideal para empresas multi-sucursal.",
        "featureList": [
          "Sistema POS inteligente",
          "Gestión de inventario con IA",
          "Control de cajas y gastos",
          "Cotizaciones digitales",
          "Reportes en tiempo real",
          "Multi-sucursal",
          "Dashboard empresarial",
          "Análisis predictivo",
          "Integración contable",
          "Soporte 24/7"
        ],
        "offers": {
          "@type": "Offer",
          "price": "250",
          "priceCurrency": "BOB",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@id": "https://smartpos.bo/#organization"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "screenshot": "https://smartpos.bo/screenshot.jpg",
        "downloadUrl": "https://smartpos.bo/registro",
        "installUrl": "https://smartpos.bo/registro",
        "storageRequirements": "Navegador web moderno",
        "memoryRequirements": "2GB RAM mínimo",
        "processorRequirements": "Cualquier procesador moderno",
        "permissions": "Acceso a internet requerido"
      },
      {
        "@type": "WebSite",
        "@id": "https://smartpos.bo/#website",
        "url": "https://smartpos.bo",
        "name": "SmartPOS Bolivia",
        "description": "Sistema de punto de venta inteligente para empresas bolivianas",
        "publisher": {
          "@id": "https://smartpos.bo/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://smartpos.bo/buscar?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
        {/* Scroll Progress Bar */}
        {mounted && (
          <div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 z-[100] transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          />
        )}

        <HeaderEnhanced mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        <main className="flex-1">
          <HeroSectionEnhanced
            mounted={mounted}
            activeUsers={activeUsers}
            viewingPage={viewingPage}
            onContactClick={() => setContactDialogOpen(true)}
            trackEvent={trackEvent}
          />

          <StatsSection stats={stats} />

          <FeaturesSection />

          <BenefitsSection />

          <PricingSection onContactClick={() => setContactDialogOpen(true)} trackEvent={trackEvent} />

          <FAQSection />
        </main>

        <Footer onContactClick={() => setContactDialogOpen(true)} />

        <ContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          contactForm={contactForm}
          setContactForm={setContactForm}
          contactFormErrors={contactFormErrors}
          setContactFormErrors={setContactFormErrors}
          isSubmitting={isSubmitting}
          contactStep={contactStep}
          setContactStep={setContactStep}
          validateEmail={validateEmail}
          handleContactSubmit={handleContactSubmit}
        />
      </div>
    </>
  )
}
