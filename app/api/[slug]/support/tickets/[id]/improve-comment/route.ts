import { NextRequest, NextResponse } from "next/server"

import { chatCompleteWithOptions } from "@/lib/services/ai/provider"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { SupportTicketSasService } from "@/lib/services/sales/support-ticket-sas-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const { slug, id } = await params

    const token = request.cookies.get("sas-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await AuthSasService.verifyToken(slug, token)
    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const text: string = body?.text || ""

    let prompt

    if (text.trim()) {
      // Modo mejorar borrador escrito por el cliente
      prompt = [
        {
          role: "system" as const,
          content:
            "Actúas como ASISTENTE DEL CLIENTE. Tu tarea es reescribir el mensaje que el cliente enviará al equipo de soporte. " +
            "Escribe el texto como si lo escribiera el propio cliente (primera persona singular), en ESPAÑOL, " +
            "mejorando ortografía, gramática y claridad, pero sin cambiar el significado ni agregar datos nuevos. " +
            "No respondas al cliente ni hables como agente de soporte, solo reescribe el mensaje del cliente. " +
            "Si el nombre del cliente aparece en el contexto, NO lo repitas como firma ni añadas cierres como 'Atentamente'. " +
            'Devuelve únicamente el mensaje mejorado, sin prefijos como "Cliente:" ni explicaciones.',
        },
        {
          role: "user" as const,
          content: text,
        },
      ]
    } else {
      // Modo "responder con IA": generar un nuevo mensaje del cliente respondiendo al último mensaje de soporte
      const ticket = await SupportTicketSasService.getTicketById(id, organizationId)

      if (!ticket) {
        return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
      }

      const comments = (ticket as any).comments || []
      let lastSupportMessage: string | null = null

      for (let i = comments.length - 1; i >= 0; i--) {
        const c = comments[i] as any
        if (c.authorType === "admin") {
          lastSupportMessage = c.content || null
          break
        }
      }

      const baseContext =
        `Eres un cliente usando un sistema de ventas. Estás en un ticket de soporte con título: "${ticket.title}".` +
        (ticket.description ? ` Descripción original del problema: "${ticket.description}".` : "")

      const supportContext = lastSupportMessage
        ? `\n\nÚltimo mensaje del equipo de soporte (al que quieres responder): "${lastSupportMessage}".`
        : "\n\nNo hay mensajes previos del equipo de soporte, genera un primer mensaje del cliente describiendo el problema."

      prompt = [
        {
          role: "system" as const,
          content:
            "Actúas como el CLIENTE que escribe al equipo de soporte. Debes redactar un mensaje en primera persona singular, " +
            "en ESPAÑOL, claro y respetuoso, respondiendo en el contexto descrito. " +
            "No hables como agente de soporte, no des soluciones técnicas avanzadas; " +
            "describe el problema, tus dudas o tu respuesta al mensaje del soporte. " +
            "No añadas cierres como 'Atentamente' ni tu nombre al final, el sistema ya conoce tu identidad. " +
            "Devuelve solo el mensaje del cliente.",
        },
        {
          role: "user" as const,
          content: `${baseContext}${supportContext}`,
        },
      ]
    }

    const improved = await chatCompleteWithOptions(prompt, { temperature: 0.3 })

    return NextResponse.json({ success: true, text: improved, ticketId: id, organizationId })
  } catch (error) {
    console.error("Error mejorando comentario de soporte (SAS):", error)
    return NextResponse.json({ error: "No se pudo mejorar el texto con IA" }, { status: 500 })
  }
}


