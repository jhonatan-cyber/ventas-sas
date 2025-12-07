"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "¿Cómo puedo empezar a usar el sistema?",
    answer: "Contáctanos y nuestro equipo te ayudará con la configuración inicial, capacitación y puesta en marcha del sistema adaptado a las necesidades de tu negocio."
  },
  {
    question: "¿Cuánto tiempo toma la configuración?",
    answer: "La configuración inicial toma menos de 5 minutos. Nuestro sistema está diseñado para ser intuitivo y fácil de usar, incluso para usuarios sin experiencia técnica."
  },
  {
    question: "¿Puedo gestionar múltiples sucursales?",
    answer: "Sí, SmartPOS está diseñado para gestionar múltiples sucursales desde un panel centralizado. Puedes administrar inventario, reportes y usuarios para todas tus ubicaciones."
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
]

export function FAQSection() {
  return (
    <section id="faq" className="py-32 bg-gradient-to-b from-muted/50 to-background border-y">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-muted-foreground">
              Todo lo que necesitas saber sobre SmartPOS
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
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
  )
}
