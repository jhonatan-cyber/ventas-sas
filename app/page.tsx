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
    "@type": "SoftwareApplication",
    "name": "SmartPOS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "250",
      "priceCurrency": "BOB"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127"
    },
    "description": "Plataforma empresarial todo-en-uno para gestión de ventas, inventario, cajas, gastos y cotizaciones."
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
