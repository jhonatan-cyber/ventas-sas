"use client"

import { ArrowRight, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactForm: {
    name: string
    email: string
    company: string
    message: string
    phone: string
  }
  setContactForm: (form: any) => void
  contactFormErrors: Record<string, string>
  setContactFormErrors: (errors: Record<string, string>) => void
  isSubmitting: boolean
  contactStep: number
  setContactStep: (step: number) => void
  validateEmail: (email: string) => boolean
  handleContactSubmit: (e: React.FormEvent) => Promise<void>
}

export function ContactDialog({
  open,
  onOpenChange,
  contactForm,
  setContactForm,
  contactFormErrors,
  setContactFormErrors,
  isSubmitting,
  contactStep,
  setContactStep,
  validateEmail,
  handleContactSubmit
}: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  )
}
