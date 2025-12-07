"use client"

import { useState } from "react"
import { toast } from "sonner"

export function useContactForm() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '', phone: '' })
  const [contactFormErrors, setContactFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactStep, setContactStep] = useState(1)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

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

  return {
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
  }
}
